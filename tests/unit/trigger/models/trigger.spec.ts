import { readFileSync } from 'fs';
import { resolve } from 'path';
import { container } from 'tsyringe';
import axiosMock from 'jest-mock-axios';
import { LayerMetadata } from '@map-colonies/mc-model-types';
import { Trigger } from '../../../../src/layerCreator/models/trigger';
import { overseerClientMock, ingestDiscreteLayerMock } from '../../../mocks/clients/overseerClient';
import { agentDbClientMock, updateDiscreteStatusMock } from '../../../mocks/clients/agentDbClient';
import { validateLayerFilesExistsMock, validateShpFilesExistsMock, filesManagerMock } from '../../../mocks/filesManager';
import { parseMock, shpParserMock } from '../../../mocks/shpParser';
import { parseFilesShpJsonMock, mapMock, metadataMapperMock } from '../../../mocks/metadataMapperMock';

import { configMock } from '../../../mocks/config';

let expectedMetadata: LayerMetadata;

describe('trigger', () => {
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

  describe('#trigger', () => {
    it('Call overseer ingest Discrete Layer', async function () {
      // set mock values
      axiosMock.post.mockResolvedValue({});
      ingestDiscreteLayerMock.mockResolvedValue({});
      updateDiscreteStatusMock.mockResolvedValue({});
      parseMock.mockResolvedValue({});
      validateLayerFilesExistsMock.mockResolvedValue(true);
      validateShpFilesExistsMock.mockResolvedValue(true);
      parseFilesShpJsonMock.mockReturnValue(['file.tiff']);
      mapMock.mockReturnValue(expectedMetadata);

      // action
      const trigger = new Trigger(shpParserMock, filesManagerMock, metadataMapperMock, overseerClientMock, agentDbClientMock, { log: jest.fn() }, configMock);
      try {
        await trigger.trigger('test');
      } catch (exception) {
        console.log(exception);
        throw exception;
      }

      // expectation
      expect(ingestDiscreteLayerMock).toHaveBeenCalledTimes(1);
      expect(ingestDiscreteLayerMock).toHaveBeenCalledWith(expectedMetadata);
      expect(updateDiscreteStatusMock).toHaveBeenCalledTimes(1);
      expect(updateDiscreteStatusMock).toHaveBeenCalledWith(expectedMetadata);
    });
  });
});
