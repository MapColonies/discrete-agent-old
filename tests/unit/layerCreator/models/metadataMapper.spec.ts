import { readFileSync } from 'fs';
import { resolve } from 'path';
import { GeoJSON } from 'geojson';
import { LayerMetadata } from '@map-colonies/mc-model-types';
import { MetadataMapper } from '../../../../src/layerCreator/models/metadataMapper';
import { fileMapperMock } from '../../../mocks/fileMapper';
import { tfw } from '../../../mockData/tfw';
import { metadata as testExpectedMetadata } from '../../../mockData/layerMetadata';

let filesGeoJson: GeoJSON;
let productGeoJson: GeoJSON;
let metadataGeoJson: GeoJSON;
let expectedMetadata: LayerMetadata;

describe('metadataMapper', () => {
  let metadataMapper: MetadataMapper;

  beforeAll(() => {
    loadTestData();
  });

  beforeEach(() => {
    metadataMapper = new MetadataMapper(fileMapperMock);
  });

  describe('map', () => {
    it('metadata is map according to model', () => {
      // action
      const metadata = metadataMapper.map(productGeoJson, metadataGeoJson, filesGeoJson, tfw);

      // expectation
      expect(metadata).toEqual(expectedMetadata);
    });
  });
});

function loadTestData() {
  const filesJsonPath = resolve(__dirname, '../../../mockData/files.json');
  const productJsonPath = resolve(__dirname, '../../../mockData/product.json');
  const metaJsonPath = resolve(__dirname, '../../../mockData/shapeMetadata.json');

  const filesStr = readFileSync(filesJsonPath, { encoding: 'utf8' });
  const productStr = readFileSync(productJsonPath, { encoding: 'utf8' });
  const geoJsonMetadataStr = readFileSync(metaJsonPath, { encoding: 'utf8' });

  filesGeoJson = (JSON.parse(filesStr) as unknown) as GeoJSON;
  productGeoJson = (JSON.parse(productStr) as unknown) as GeoJSON;
  metadataGeoJson = (JSON.parse(geoJsonMetadataStr) as unknown) as GeoJSON;
  expectedMetadata = ({ ...testExpectedMetadata } as unknown) as LayerMetadata;
  expectedMetadata.updateDate = new Date((expectedMetadata.updateDate as unknown) as string);
  expectedMetadata.sourceDateStart = new Date((expectedMetadata.sourceDateStart as unknown) as string);
  expectedMetadata.sourceDateEnd = new Date((expectedMetadata.sourceDateEnd as unknown) as string);
}
