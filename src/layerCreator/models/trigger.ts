import * as path from 'path';
import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import axios from 'axios';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { ShpParser } from './shpParser';
import { FilesManager } from './filesManager';
import { MetadataMapper } from './metadataMapper';

@injectable()
export class Trigger {
  public constructor(
    private readonly shpParser: ShpParser,
    private readonly fileManager: FilesManager,
    private readonly metadataMapper: MetadataMapper,
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(Services.CONFIG) private readonly config: IConfig
  ) {}

  public async trigger(directory: string, isManual = false): Promise<void> {
    //TODO: get history
    //TODO: if history don't exists create it
    //TODO: if history is not pending exit
    //check if all shp files exists
    const filesShp = path.join(directory, 'Files.shp');
    const filesDbf = path.join(directory, 'Files.dbf');
    const productShp = path.join(directory, 'Product.shp');
    const productDbf = path.join(directory, 'Product.dbf');
    const metadataShp = path.join(directory, 'ShapeMetadata.shp');
    const metadataDbf = path.join(directory, 'ShapeMetadata.dbf');
    if (await this.fileManager.validateShpFilesExists(filesShp, filesDbf, productShp, productDbf, metadataShp, metadataDbf)) {
      //read file list
      const filesGeoJson = await this.shpParser.parse(filesShp, filesDbf);
      const files = this.metadataMapper.parseFilesShpJson(filesGeoJson);
      if (!(await this.fileManager.validateLayerFilesExists(directory, files))) {
        if (isManual) {
          this.handleManualMissingFilesError();
        }
        return;
      }
      // parse all shp files and convert to model
      const productGeoJson = await this.shpParser.parse(productShp, productDbf);
      const metaDataGeoJson = await this.shpParser.parse(metadataShp, metadataDbf);
      //TODO: add error handling for parsing failure (due to invalid file or file still being copied)
      const metadata = this.metadataMapper.map(productGeoJson, metaDataGeoJson, filesGeoJson);
      this.logger.log('info', `Trigger overseer for id: ${metadata.source as string} version: ${metadata.version as string}`);
      const overseerUrlPath = this.config.get<string>('overseer.url');
      try {
        await axios.post(`${overseerUrlPath}/layers`, metadata);
      } catch (err) {
        const error = err as Error;
        this.logger.log(
          'error',
          `failed to trigger overseer for for id=${metadata.source as string} version=${metadata.version as string}, error=${error.message}`
        );
        //TODO: add custom error
        throw err;
      }

      this.logger.log('info', `Update agent-DB history for id: ${metadata.source as string} version: ${metadata.version as string}`);
      const agentDBUrlPath = this.config.get<string>('agentDB.url');
      try {
        await axios.post(`${agentDBUrlPath}/${metadata.source as string}/${metadata.version as string}`);
      } catch (err) {
        const error = err as Error;
        this.logger.log(
          'error',
          `failed to update agent-DB for for id=${metadata.source as string} version=${metadata.version as string}, error=${error.message}`
        );
      }
    } else if (isManual) {
      this.handleManualMissingFilesError();
    }
  }

  private handleManualMissingFilesError(): void {
    //TODO: replace with custom error
    throw new Error('missing files');
  }
}
