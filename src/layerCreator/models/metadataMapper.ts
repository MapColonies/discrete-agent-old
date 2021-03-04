import { IPropSHPMapping, LayerMetadata, ShapeFileType } from '@map-colonies/mc-model-types';
import { injectable } from 'tsyringe';
import { FeatureCollection, GeoJSON } from 'geojson';
import { get as readProp } from 'lodash';

@injectable()
export class MetadataMapper {
  private readonly mappings: IPropSHPMapping[];

  public constructor() {
    this.mappings = LayerMetadata.getShpMappings();
  }

  public map(productGeoJson: GeoJSON, metadataGeoJson: GeoJSON, filesGeoJson: GeoJSON): LayerMetadata {
    const metadata: LayerMetadata = {};
    metadata.fileUris = this.parseFilesShpJson(filesGeoJson);
    this.autoMapModels(metadata, productGeoJson, metadataGeoJson, filesGeoJson);
    this.parseIdentifiers(metadata);
    return metadata;
  }

  public parseFilesShpJson(filesJson: GeoJSON): string[] {
    const features = (filesJson as FeatureCollection).features;
    const files = features.map((feature) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const file = feature.properties as { 'File Name': string; Format: string };
      return `${file['File Name']}.${file.Format}`;
    });
    return files;
  }

  private autoMapModels(baseMetadata: LayerMetadata, productGeoJson: GeoJSON, metadataGeoJson: GeoJSON, filesGeoJson: GeoJSON): void {
    const metadata = baseMetadata as Record<string, unknown>;
    const sources = {} as { [key: string]: GeoJSON };
    sources[ShapeFileType.FILES] = filesGeoJson;
    sources[ShapeFileType.PRODUCT] = productGeoJson;
    sources[ShapeFileType.SHAPE_METADATA] = metadataGeoJson;
    this.mappings.forEach((map) => {
      metadata[map.prop] = readProp(sources[map.shpFile], map.valuePath);
    });
  }

  private parseIdentifiers(metadata: LayerMetadata): void {
    const source = metadata.source as string;
    const parts = source.split('-');
    metadata.version = parts.pop();
    metadata.id = parts.join('-');
  }
}
