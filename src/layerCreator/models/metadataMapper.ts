import { IPropSHPMapping, LayerMetadata, DataFileType, TsTypes, SensorType } from '@map-colonies/mc-model-types';
import { injectable } from 'tsyringe';
import { FeatureCollection, GeoJSON } from 'geojson';
import { get as readProp, toNumber } from 'lodash';
import { toBoolean } from '../../common/utilities/typeConvertors';
import { FileMapper } from './fileMapper';

@injectable()
export class MetadataMapper {
  private readonly mappings: IPropSHPMapping[];

  public constructor(private readonly fileMapper: FileMapper) {
    this.mappings = LayerMetadata.getShpMappings();
  }

  public map(productGeoJson: GeoJSON, metadataGeoJson: GeoJSON, filesGeoJson: GeoJSON, tfwFile: string[]): LayerMetadata {
    const metadata = ({} as unknown) as LayerMetadata;
    this.autoMapModels(metadata, productGeoJson, metadataGeoJson, filesGeoJson, tfwFile);
    this.parseIdentifiers(metadata, metadataGeoJson);
    this.parseSourceDates(metadata, metadataGeoJson);
    this.parseSensorTypes(metadata, metadataGeoJson);
    this.parseLayerPolygonParts(metadata, metadataGeoJson);
    return metadata;
  }

  public parseFilesShpJson(filesJson: GeoJSON): string[] {
    const features = (filesJson as FeatureCollection).features;
    const files = features.map((feature) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const file = feature.properties as { 'File Name': string; Format: string };
      return this.fileMapper.getFilePath(file['File Name'], file.Format);
    });
    return files;
  }

  private autoMapModels(
    baseMetadata: LayerMetadata,
    productGeoJson: GeoJSON,
    metadataGeoJson: GeoJSON,
    filesGeoJson: GeoJSON,
    tfwFile: string[]
  ): void {
    const metadata = (baseMetadata as unknown) as Record<string, unknown>;
    const sources = {} as { [key: string]: unknown };
    sources[DataFileType.FILES] = filesGeoJson;
    sources[DataFileType.PRODUCT] = productGeoJson;
    sources[DataFileType.SHAPE_METADATA] = metadataGeoJson;
    sources[DataFileType.TFW] = tfwFile;
    this.mappings.forEach((map) => {
      const type = map.mappingType.value;
      const value = readProp(sources[map.dataFile], map.valuePath) as unknown;
      metadata[map.prop] = this.castValue(value, type);
    });
  }

  private parseIdentifiers(metadata: LayerMetadata, metadataGeoJson: GeoJSON): void {
    const source = readProp(metadataGeoJson, 'features[0].properties.Source') as string;
    const parts = source.split('-');
    metadata.productId = parts[0];
    metadata.productVersion = parts[1];
  }

  private parseSourceDates(metadata: LayerMetadata, metadataGeoJson: GeoJSON): void {
    const features = (metadataGeoJson as FeatureCollection).features;
    const dates = features.map((feature) => {
      const dateStr = readProp(feature, 'properties.UpdateDate') as string;
      return new Date(dateStr);
    });
    let maxDate = dates[0];
    let minDate = dates[0];
    for (let i = 1; i < dates.length; i++) {
      if (dates[i] > maxDate) {
        maxDate = dates[i];
      } else if (dates[i] < minDate) {
        minDate = dates[i];
      }
    }
    metadata.sourceDateStart = minDate;
    metadata.sourceDateEnd = maxDate;
    metadata.updateDate = maxDate;
  }

  private parseSensorTypes(metadata: LayerMetadata, metadataGeoJson: GeoJSON): void {
    const features = (metadataGeoJson as FeatureCollection).features;
    const types = new Set<SensorType>();
    features.forEach((feature) => {
      const sensor = readProp(feature, 'properties.SensorType') as SensorType;
      types.add(sensor);
    });
    metadata.sensorType = Array.from(types);
  }

  private parseLayerPolygonParts(metadata: LayerMetadata, metadataGeoJson: GeoJSON): void {
    metadata.layerPolygonParts = metadataGeoJson;
  }

  private castValue(value: unknown, type: string): unknown {
    if (value === undefined) {
      return undefined;
    }
    switch (type) {
      case TsTypes.BOOLEAN.value:
        return toBoolean(value);
      case TsTypes.DATE.value:
        return new Date(value as string);
      case TsTypes.NUMBER.value:
        return toNumber(value);
      default:
        return value;
    }
  }
}
