import * as path from 'path';
import { inject, injectable } from 'tsyringe';
import { GeoJSON } from 'geojson';
import retry from 'async-retry';
import { toInteger, get as readProp } from 'lodash';
import { IngestionParams } from '@map-colonies/mc-model-types';
import { Services } from '../../common/constants';
import { ILogger, IConfig } from '../../common/interfaces';
import { BadRequestError } from '../../common/exceptions/http/badRequestError';
import { toBoolean } from '../../common/utilities/typeConvertors';
import { OverseerClient } from '../../serviceClients/overseerClient';
import { AgentDbClient } from '../../serviceClients/agentDbClient';
import { HistoryStatus } from '../historyStatus';
import { LimitingLock } from '../../watcher/limitingLock';
import { ShpParser } from './shpParser';
import { FilesManager } from './filesManager';
import { MetadataMapper } from './metadataMapper';
import { FileMapper } from './fileMapper';

@injectable()
export class Trigger {
  private readonly mountDir: string;
  private readonly retryOptions: retry.Options;

  public constructor(
    private readonly shpParser: ShpParser,
    private readonly fileManager: FilesManager,
    private readonly metadataMapper: MetadataMapper,
    private readonly overseerClient: OverseerClient,
    private readonly agentDbClient: AgentDbClient,
    private readonly lock: LimitingLock,
    private readonly fileMapper: FileMapper,
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(Services.CONFIG) private readonly config: IConfig
  ) {
    this.mountDir = config.get<string>('mountDir');
    this.retryOptions = this.parseOptions(config);
  }

  public async trigger(directory: string, isManual = false): Promise<void> {
    const relDir = this.fileMapper.getRootDir(directory);
    this.logger.log('debug', `mount: ${this.mountDir} , full dir: ${directory} , relative dir: ${relDir}`);
    const status = await this.agentDbClient.getDiscreteStatus(relDir);
    if (status === undefined) {
      await this.agentDbClient.createDiscreteStatus(relDir);
    } else if (status.status === HistoryStatus.TRIGGERED || status.status === HistoryStatus.FAILED) {
      if (!isManual) {
        this.logger.log('debug', `skipping directory ${relDir} its status is ${status.status}`);
        return;
      } else {
        await this.agentDbClient.updateDiscreteStatus(relDir, HistoryStatus.IN_PROGRESS);
      }
    }
    //check if all shp files exists
    const filesShp = await this.fileMapper.getFileFullPath('Files', 'shp', directory);
    const filesDbf = await this.fileMapper.getFileFullPath('Files', 'dbf', directory);
    const productShp = await this.fileMapper.getFileFullPath('Product', 'shp', directory);
    const productDbf = await this.fileMapper.getFileFullPath('Product', 'dbf', directory);
    const metadataShp = await this.fileMapper.getFileFullPath('ShapeMetadata', 'shp', directory);
    const metadataDbf = await this.fileMapper.getFileFullPath('ShapeMetadata', 'dbf', directory);
    if (await this.fileManager.validateShpFilesExists(filesShp, filesDbf, productShp, productDbf, metadataShp, metadataDbf)) {
      //read file list
      const filesGeoJson = await this.tryParseShp(filesShp as string, filesDbf as string, isManual, directory);
      if (!filesGeoJson) {
        return;
      }
      const files = this.metadataMapper.parseFilesShpJson(filesGeoJson);
      if (!(await this.fileManager.validateLayerFilesExists(directory, files))) {
        if (isManual) {
          await this.agentDbClient.updateDiscreteStatus(relDir, HistoryStatus.FAILED);
          throw new BadRequestError('some of the required files are missing');
        }
        return;
      }
      const tfwFileName = readProp(filesGeoJson, "features[0].properties['File Name']") as string;
      const tfwFilePath = path.join(directory, this.fileMapper.getFilePath(tfwFileName, 'tfw'));
      if (!(await this.fileManager.fileExists(tfwFilePath))) {
        if (isManual) {
          await this.agentDbClient.updateDiscreteStatus(relDir, HistoryStatus.FAILED);
          throw new BadRequestError(`${tfwFilePath} is missing`);
        }
        return;
      }
      // parse all data files and convert to model
      const productGeoJson = await this.tryParseShp(productShp as string, productDbf as string, isManual, directory);
      const metaDataGeoJson = await this.tryParseShp(metadataShp as string, metadataDbf as string, isManual, directory);
      if (!productGeoJson || !metaDataGeoJson) {
        return;
      }
      const tfwFile = await this.fileManager.readAllLines(tfwFilePath);
      const ingestionData: IngestionParams = {
        fileNames: this.metadataMapper.parseFilesShpJson(filesGeoJson),
        metadata: this.metadataMapper.map(productGeoJson, metaDataGeoJson, filesGeoJson, tfwFile),
        originDirectory: relDir,
      };
      try {
        await this.overseerClient.ingestDiscreteLayer(ingestionData);
        await this.agentDbClient.updateDiscreteStatus(
          relDir,
          HistoryStatus.TRIGGERED,
          ingestionData.metadata.productId,
          ingestionData.metadata.productVersion
        );
      } catch (err) {
        await this.agentDbClient.updateDiscreteStatus(
          relDir,
          HistoryStatus.FAILED,
          ingestionData.metadata.productId,
          ingestionData.metadata.productVersion
        );
        if (isManual) {
          throw err;
        }
      }
    } else if (isManual) {
      await this.agentDbClient.updateDiscreteStatus(relDir, HistoryStatus.FAILED);
      throw new BadRequestError('some of the required shape files are missing');
    }
  }

  private async tryParseShp(shp: string, dbf: string, isManual: boolean, directory: string): Promise<GeoJSON | undefined> {
    const res = await retry(async (bail) => {
      try {
        return await this.shpParser.parse(shp, dbf);
      } catch (err) {
        if (isManual) {
          //throw error to user on manual trigger
          bail(err);
        } else if (this.lock.isQueueEmpty(directory)) {
          //trigger retry only when it was triggered by watcher and it is the last file that was copied to watch dir
          throw err;
        } else {
          //ignore error if new files ware added to target dir after this trigger
          return undefined;
        }
      }
    }, this.retryOptions);
    return res;
  }

  private parseOptions(config: IConfig): retry.Options {
    const options = { ...config.get<retry.Options>('watcher.shpRetry') };
    if (options.retries != undefined) {
      options.retries = toInteger(options.retries);
    }
    if (options.factor !== undefined) {
      options.factor = toInteger(options.factor);
    }
    if (options.minTimeout !== undefined) {
      options.minTimeout = toInteger(options.minTimeout);
    }
    if (options.maxRetryTime !== undefined) {
      options.maxRetryTime = toInteger(options.maxTimeout);
    }
    if (options.randomize !== undefined) {
      options.randomize = toBoolean(options.randomize);
    }
    return options;
  }
}
