import * as path from 'path';
import { inject, injectable } from 'tsyringe';
import { GeoJSON } from 'geojson';
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
  public constructor(
    private readonly shpParser: ShpParser,
    private readonly fileManager: FilesManager,
    private readonly metadataMapper: MetadataMapper,
    private readonly overseerClient: OverseerClient,
    private readonly agentDbClient: AgentDbClient,
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(Services.CONFIG) private readonly config: IConfig
  ) {}

  public async trigger(directory: string, isManual = false): Promise<void> {
    const status = await this.agentDbClient.getDiscreteStatus(directory);
    if (status === undefined) {
      await this.agentDbClient.createDiscreteStatus(directory);
    } else if (status.status === HistoryStatus.TRIGGERED || status.status === HistoryStatus.FAILED) {
      if (!isManual) {
        this.logger.log('debug', `skipping directory ${directory} its status is ${status.status}`);
        return;
      } else {
        await this.agentDbClient.updateDiscreteStatus(directory, HistoryStatus.IN_PROGRESS);
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
          await this.agentDbClient.updateDiscreteStatus(directory, HistoryStatus.FAILED);
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
      const metadata = this.metadataMapper.map(productGeoJson, metaDataGeoJson, filesGeoJson);
      try {
        await this.overseerClient.ingestDiscreteLayer(metadata);
        await this.agentDbClient.updateDiscreteStatus(directory, HistoryStatus.TRIGGERED, metadata.id, metadata.version);
      } catch (err) {
        await this.agentDbClient.updateDiscreteStatus(directory, HistoryStatus.FAILED, metadata.id, metadata.version);
        if (isManual) {
          throw err;
        }
      }
    } else if (isManual) {
      await this.agentDbClient.updateDiscreteStatus(directory, HistoryStatus.FAILED);
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
