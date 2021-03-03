import * as path from 'path';
import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import { LayerMetadata, SensorType } from '@map-colonies/mc-model-types';
import { GeoJSON, FeatureCollection } from 'geojson';
import axios from 'axios';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { ShpParser } from './shpParser';
import { FilesManager } from './filesManager';

interface IMetaDataFeatureProperties {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Dsc: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Source: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SourceName: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  UpdateDate: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Resolution: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Ep90: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Rms: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SensorType: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Scale: string;
}

@injectable()
export class Trigger {
  public constructor(
    private readonly shpParser: ShpParser,
    private readonly fileManager: FilesManager,
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
      const files = this.parseFilesShpJson(filesGeoJson);
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
      const metadata = this.parseToMetadata(productGeoJson, metaDataGeoJson, files);
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

  private parseToMetadata(productGeoJson: GeoJSON, metadataGeoJson: GeoJSON, files: string[]): LayerMetadata {
    const metadataFeature = (metadataGeoJson as FeatureCollection).features[0];
    const metadataProperties = metadataFeature.properties as IMetaDataFeatureProperties;
    const parts = metadataProperties.Source.split('-');
    const version = parts.pop();
    const id = parts.join('-');
    const metadata: LayerMetadata = {
      id: id,
      version: version,
      dsc: metadataProperties.Dsc,
      source: metadataProperties.Source,
      sourceName: metadataProperties.SourceName,
      ep90: Number.parseFloat(metadataProperties.Ep90),
      geometry: metadataFeature.geometry,
      resolution: Number.parseFloat(metadataProperties.Resolution),
      rms: Number.parseFloat(metadataProperties.Rms),
      scale: metadataProperties.Scale,
      sensorType: SensorType[metadataProperties.SensorType as keyof typeof SensorType],
      fileUris: files,
      updateDate: new Date(metadataProperties.UpdateDate),
    };
    return metadata;
  }

  private parseFilesShpJson(filesJson: GeoJSON): string[] {
    const features = (filesJson as FeatureCollection).features;
    const files = features.map((feature) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const file = feature.properties as { 'File Name': string; Format: string };
      return `${file['File Name']}.${file.Format}`;
    });
    return files;
  }

  private handleManualMissingFilesError(): void {
    //TODO: replace with custom error
    throw new Error('missing files');
  }
}
