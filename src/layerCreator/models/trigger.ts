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
  private readonly shpFiles = ['Files.shp', 'Files.dbf', 'Product.shp', 'Product.dbf', 'ShapeMetadata.shp', 'ShapeMetadata.dbf'];

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
    const rootDir = this.fileMapper.getRootDir(directory, isManual);
    this.logger.log('debug', `triggering on directory: ${directory}`);
    const status = await this.agentDbClient.getDiscreteStatus(rootDir);
    if (status === undefined) {
      await this.agentDbClient.createDiscreteStatus(rootDir);
    } else if (status.status === HistoryStatus.TRIGGERED || status.status === HistoryStatus.FAILED) {
      if (!isManual) {
        this.logger.log('debug', `skipping directory ${rootDir} its status is ${status.status}`);
        return;
      } else {
        await this.agentDbClient.updateDiscreteStatus(rootDir, HistoryStatus.IN_PROGRESS);
      }
    }
    //check if all shp files exists
    const shpFilesPaths = await this.fileMapper.findFilesRelativePaths(this.shpFiles, rootDir);
    if (shpFilesPaths.length === this.shpFiles.length) {
      //map shp file paths
      let filesShp!: string, filesDbf!: string, productShp!: string, productDbf!: string, metadataShp!: string, metadataDbf!: string;
      for (const path of shpFilesPaths) {
        if (path.endsWith(this.shpFiles[0])) {
          filesShp = path;
        } else if (path.endsWith(this.shpFiles[1])) {
          filesDbf = path;
        } else if (path.endsWith(this.shpFiles[2])) {
          productShp = path;
        } else if (path.endsWith(this.shpFiles[3])) {
          productDbf = path;
        } else if (path.endsWith(this.shpFiles[4])) {
          metadataShp = path;
        } else if (path.endsWith(this.shpFiles[5])) {
          metadataDbf = path;
        }
      }
      //read file list
      const filesGeoJson = await this.tryParseShp(filesShp, filesDbf, isManual, rootDir);
      if (!filesGeoJson) {
        return;
      }
      const fileNames = this.metadataMapper.parseFilesShpJson(filesGeoJson);
      const files = await this.fileMapper.findFilesRelativePaths(fileNames, rootDir);
      if (files.length != fileNames.length) {
        if (isManual) {
          await this.agentDbClient.updateDiscreteStatus(directory, HistoryStatus.FAILED);
          throw new BadRequestError('some of the required files are missing');
        }
        return;
      }
      const tfwFileName = readProp(filesGeoJson, "features[0].properties['File Name']") as string;
      const tfwFilePath = await this.fileMapper.getFileFullPath(tfwFileName, 'tfw', rootDir, isManual);
      if (tfwFilePath === undefined) {
        if (isManual) {
          await this.agentDbClient.updateDiscreteStatus(rootDir, HistoryStatus.FAILED);
          throw new BadRequestError(`${tfwFileName} tfw is missing`);
        }
        return;
      }
      // parse all data files and convert to model
      const productGeoJson = await this.tryParseShp(productShp, productDbf, isManual, directory);
      const metaDataGeoJson = await this.tryParseShp(metadataShp, metadataDbf, isManual, directory);
      if (!productGeoJson || !metaDataGeoJson) {
        return;
      }
      const tfwFile = await this.fileManager.readAllLines(tfwFilePath);
      const ingestionData: IngestionParams = {
        fileNames: files,
        metadata: this.metadataMapper.map(productGeoJson, metaDataGeoJson, filesGeoJson, tfwFile),
        originDirectory: rootDir,
      };
      try {
        await this.overseerClient.ingestDiscreteLayer(ingestionData);
        await this.agentDbClient.updateDiscreteStatus(
          rootDir,
          HistoryStatus.TRIGGERED,
          ingestionData.metadata.productId,
          ingestionData.metadata.productVersion
        );
      } catch (err) {
        await this.agentDbClient.updateDiscreteStatus(
          rootDir,
          HistoryStatus.FAILED,
          ingestionData.metadata.productId,
          ingestionData.metadata.productVersion
        );
        if (isManual) {
          throw err;
        }
      }
    } else if (isManual) {
      await this.agentDbClient.updateDiscreteStatus(rootDir, HistoryStatus.FAILED);
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
