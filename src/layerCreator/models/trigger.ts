import * as path from 'path';
import { inject, injectable } from 'tsyringe';
import { GeoJSON } from 'geojson';
import { IngestionParams } from '@map-colonies/mc-model-types';
import { Services } from '../../common/constants';
import { ILogger, IConfig } from '../../common/interfaces';
import { BadRequestError } from '../../common/exceptions/http/badRequestError';
import { OverseerClient } from '../../serviceClients/overseerClient';
import { AgentDbClient } from '../../serviceClients/agentDbClient';
import { HistoryStatus } from '../historyStatus';
import { ShpParser } from './shpParser';
import { FilesManager } from './filesManager';
import { MetadataMapper } from './metadataMapper';

@injectable()
export class Trigger {
  private readonly mountDir: string;

  public constructor(
    private readonly shpParser: ShpParser,
    private readonly fileManager: FilesManager,
    private readonly metadataMapper: MetadataMapper,
    private readonly overseerClient: OverseerClient,
    private readonly agentDbClient: AgentDbClient,
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(Services.CONFIG) private readonly config: IConfig
  ) {
    this.mountDir = config.get<string>('mountDir');
  }

  public async trigger(directory: string, isManual = false): Promise<void> {
    const relDir = path.relative(this.mountDir, directory);
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
    const filesShp = path.join(directory, 'Files.shp');
    const filesDbf = path.join(directory, 'Files.dbf');
    const productShp = path.join(directory, 'Product.shp');
    const productDbf = path.join(directory, 'Product.dbf');
    const metadataShp = path.join(directory, 'ShapeMetadata.shp');
    const metadataDbf = path.join(directory, 'ShapeMetadata.dbf');
    if (await this.fileManager.validateShpFilesExists(filesShp, filesDbf, productShp, productDbf, metadataShp, metadataDbf)) {
      //read file list
      const filesGeoJson = await this.tryParseShp(filesShp, filesDbf, isManual);
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
      // parse all shp files and convert to model
      const productGeoJson = await this.tryParseShp(productShp, productDbf, isManual);
      const metaDataGeoJson = await this.tryParseShp(metadataShp, metadataDbf, isManual);
      if (!productGeoJson || !metaDataGeoJson) {
        return;
      }
      const ingestionData: IngestionParams = {
        fileNames: this.metadataMapper.parseFilesShpJson(filesGeoJson),
        metadata: this.metadataMapper.map(productGeoJson, metaDataGeoJson, filesGeoJson),
        originDirectory: relDir,
      };
      try {
        await this.overseerClient.ingestDiscreteLayer(ingestionData);
        await this.agentDbClient.updateDiscreteStatus(relDir, HistoryStatus.TRIGGERED, ingestionData.metadata.id, ingestionData.metadata.version);
      } catch (err) {
        await this.agentDbClient.updateDiscreteStatus(relDir, HistoryStatus.FAILED, ingestionData.metadata.id, ingestionData.metadata.version);
        if (isManual) {
          throw err;
        }
      }
    } else if (isManual) {
      await this.agentDbClient.updateDiscreteStatus(relDir, HistoryStatus.FAILED);
      throw new BadRequestError('some of the required shape files are missing');
    }
  }

  private async tryParseShp(shp: string, dbf: string, isManual: boolean): Promise<GeoJSON | undefined> {
    try {
      return await this.shpParser.parse(shp, dbf);
    } catch (err) {
      if (isManual) {
        throw err;
      } else {
        //TODO: add error handling for parsing failure (due to invalid file or file still being copied)
        return undefined;
      }
    }
  }
}
