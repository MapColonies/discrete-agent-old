import { readFileSync } from 'fs';
import { resolve } from 'path';
import { FeatureCollection, GeoJSON } from 'geojson';
import { cloneDeep } from 'lodash';
import { LayerMetadata } from '@map-colonies/mc-model-types';
import { MetadataMapper } from '../../../../src/layerCreator/models/metadataMapper';
import { fileMapperMock } from '../../../mocks/fileMapper';
import { classifierMock, getClassificationMock } from '../../../mocks/classifier';
import { tfw } from '../../../mockData/tfw';
import { metadata as testExpectedMetadata } from '../../../mockData/layerMetadata';

let filesGeoJson: GeoJSON;
let productGeoJson: GeoJSON;
let metadataGeoJson: GeoJSON;
let expectedMetadata: LayerMetadata;
const nowDate = new Date('2019-04-06T00:00:00.000Z');

describe('metadataMapper', () => {
  let metadataMapper: MetadataMapper;

  beforeAll(() => {
    loadTestData();
  });

  beforeEach(() => {
    getClassificationMock.mockReturnValue(4);
    jest.useFakeTimers().setSystemTime(nowDate);
    metadataMapper = new MetadataMapper(fileMapperMock, classifierMock);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
    jest.resetAllMocks();
  });

  describe('map', () => {
    it('metadata is map according to model', async () => {
      // action
      const metadata = await metadataMapper.map(productGeoJson, metadataGeoJson, filesGeoJson, tfw);

      // expectation
      expect(metadata).toEqual(expectedMetadata);
    });

    it('mapped region dont have duplicates with multiple polygon parts', async () => {
      const srcMetadata = cloneDeep(metadataGeoJson) as FeatureCollection;
      srcMetadata.features.push(srcMetadata.features[0]);

      const destMetadata = cloneDeep(expectedMetadata);
      const expectedPolygonParts = destMetadata.layerPolygonParts as FeatureCollection;
      expectedPolygonParts.features.push(expectedPolygonParts.features[0]);
      // action
      const metadata = await metadataMapper.map(productGeoJson, srcMetadata, filesGeoJson, tfw);

      // expectation
      expect(metadata).toEqual(destMetadata);
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

  filesGeoJson = JSON.parse(filesStr) as unknown as GeoJSON;
  productGeoJson = JSON.parse(productStr) as unknown as GeoJSON;
  metadataGeoJson = JSON.parse(geoJsonMetadataStr) as unknown as GeoJSON;
  expectedMetadata = { ...testExpectedMetadata, rawProductData: productGeoJson } as unknown as LayerMetadata;
  expectedMetadata.updateDate = new Date(expectedMetadata.updateDate as unknown as string);
  expectedMetadata.sourceDateStart = new Date(expectedMetadata.sourceDateStart as unknown as string);
  expectedMetadata.sourceDateEnd = new Date(expectedMetadata.sourceDateEnd as unknown as string);
}
