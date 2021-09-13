import { FileMapper } from '../../../../src/layerCreator/models/fileMapper';
import { configMock, registerDefaultConfig } from '../../../mocks/config';
import { dirWalkerMock } from '../../../mocks/dirWalker';
import { loggerMock } from '../../../mocks/logger';

describe('FileMapper', () => {
  beforeEach(() => {
    registerDefaultConfig();
  });

  describe('getFilePath', () => {
    it('returns file name and extension when not mapped', () => {
      const fileMapper = new FileMapper(configMock, loggerMock, dirWalkerMock);

      // action
      const cleanPath = fileMapper.getFilePath('test', 'a');

      // expectation
      expect(cleanPath).toEqual('test.a');
    });

    it('returns file path when mapped', () => {
      const fileMapper = new FileMapper(configMock, loggerMock, dirWalkerMock);
      const mappings = ((fileMapper as unknown) as { fileMappings: Record<string, unknown> }).fileMappings;
      mappings['test'] = {
        fileExtension: 'ext',
      };

      // action
      const cleanPath = fileMapper.getFilePath('test', 'test');

      // expectation
      expect(cleanPath).toEqual('test.ext');
    });
  });

  describe('getRootDir', () => {});

  describe('getFileFullPath', () => {});
});
