import { promises as fsPromise } from 'fs';
import { constants as fsConstants } from 'fs';
import { isAbsolute, join } from 'path';
import { injectable } from 'tsyringe';
import { LayerMetadata, SensorType } from '@map-colonies/mc-model-types';
import { GeoJSON, FeatureCollection } from 'geojson';
import { ShpParser } from './shpParser';

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
  public constructor(private readonly shpParser: ShpParser) {}
  public async trigger(directory: string): Promise<void> {
    //TODO: get history
    //TODO: if history don't exists create it
    //TODO: if history is not pending exit
    //check if all shp files exists
    const filesShp = `${directory}/Files.shp`;
    const filesDbf = `${directory}/Files.dbf`;
    const productShp = `${directory}/Product.shp`;
    const productDbf = `${directory}/Product.dbf`;
    const metadataShp = `${directory}/ShapeMetadata.shp`;
    const metadataDbf = `${directory}/ShapeMetadata.dbf`;
    if (await this.validateShpFilesExists(filesShp, filesDbf, productShp, productDbf, metadataShp, metadataDbf)) {
      //read file list
      const filesGeoJson = await this.shpParser.parse(filesShp, filesDbf);
      const files = this.parseFilesShpJson(filesGeoJson);
      if (!(await this.validateLayerFilesExists(directory, files))) {
        return;
      }
      // parse all shp files and convert to model
      const productGeoJson = await this.shpParser.parse(productShp, productDbf);
      const metaDataGeoJson = await this.shpParser.parse(metadataShp, metadataDbf);
      this.parseToMetadata(productGeoJson, metaDataGeoJson, files);
      //TODO: trigger overseer
      //TODO: update history status to triggered
    }
  }

  private async validateShpFilesExists(
    filesShp: string,
    filesDbf: string,
    productShp: string,
    productDbf: string,
    metadataShp: string,
    metadataDbf: string
  ): Promise<boolean> {
    return (
      (await this.fileExists(filesShp)) &&
      (await this.fileExists(filesDbf)) &&
      (await this.fileExists(productShp)) &&
      (await this.fileExists(productDbf)) &&
      (await this.fileExists(metadataShp)) &&
      (await this.fileExists(metadataDbf))
    );
  }

  private async validateLayerFilesExists(directory: string, files: string[]): Promise<boolean> {
    for (let i = 0; i < files.length; i++) {
      if (!isAbsolute(files[i])) {
        files[i] = join(directory, files[i]);
      }
      if (!(await this.fileExists(files[i]))) {
        return false;
      }
    }
    return true;
  }

  private async fileExists(path: string): Promise<boolean> {
    return fsPromise
      .access(path, fsConstants.F_OK)
      .then(() => true)
      .catch(() => false);
  }

  private parseToMetadata(productGeoJson: GeoJSON, metadataGeoJson: GeoJSON, files: string[]): LayerMetadata {
    const metadataFeature = (metadataGeoJson as FeatureCollection).features[0];
    const metadataProperties = metadataFeature.properties as IMetaDataFeatureProperties;
    const metadata: LayerMetadata = {
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
}
