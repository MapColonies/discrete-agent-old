import { readFileSync } from 'fs';
import { resolve } from 'path';
import { container } from 'tsyringe';
import axiosMock from 'jest-mock-axios';
import { Trigger } from '../../../../src/layerCreator/models/trigger';
import { OverseerClientMock, ingestDiscreteLayerMock } from '../../../mocks/clients/overseerClient';
import { validateLayerFilesExistsMock, validateShpFilesExistsMock, filesManagerMock } from '../../../mocks/filesManager';
import { ShpParserMock } from '../../../mocks/shpParser';

import { getMock as configGetMock, configMock } from '../../../mocks/config';
import { LayerMetadata } from '@map-colonies/mc-model-types';
import { MetadataMapper } from '../../../../src/layerCreator/models/metadataMapper';

let expectedMetadata: LayerMetadata;

const parseFilesShpJsonMock = jest.fn();
const mapMock = jest.fn();
const MetadataMapperMock = ({
  parseFilesShpJson: parseFilesShpJsonMock,
  map: mapMock
} as unknown) as MetadataMapper;


describe('OverseerClient', () => {
  beforeEach(function () {
    const layerMetadataPath = resolve(__dirname, '../../../mockData/layerMetadata.json');
    const layerMetadataStr = readFileSync(layerMetadataPath, { encoding: 'utf8' });
    expectedMetadata = (JSON.parse(layerMetadataStr) as unknown) as LayerMetadata;
  });
  afterEach(function () {
    container.clearInstances();
    jest.resetAllMocks();
    axiosMock.reset();
  });

  describe('#OverseerClient', () => {
    it('Call overseer ingest Discrete Layer', async function () {
      expect.assertions(2);
      // set mock values
      validateLayerFilesExistsMock.mockResolvedValue(true);
      validateShpFilesExistsMock.mockResolvedValue(true);
      parseFilesShpJsonMock.mockReturnValue(["file.tiff"]);
      mapMock.mockReturnValue({
        description: 'test desc',
        maxZoomLevel: 18,
        name: 'test-1',
        tilesPath: 'test/1',
      });
      
      // action
      const trigger = new Trigger(ShpParserMock, filesManagerMock, MetadataMapperMock, OverseerClientMock, { log: jest.fn() }, configMock);
      try {
        await trigger.trigger('test');  
      } catch (exception) {
        console.log(exception);
        throw exception;
      }
      

      expect(ingestDiscreteLayerMock).toHaveBeenCalledTimes(1);
      const expectedTriggerOverseerReq = {
        description: 'test desc',
        maxZoomLevel: 18,
        name: 'test-1',
        tilesPath: 'test/1',
      };
      // expectation
      expect(ingestDiscreteLayerMock).toHaveBeenCalledWith(expectedTriggerOverseerReq);
      return;
    });
  });
});
