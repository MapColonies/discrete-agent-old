import { normalize } from 'path';
import { FileMapper } from '../../../../src/layerCreator/models/fileMapper';

describe('FileMapper', () => {
  describe('stripSubDirs', () => {
    it('remove layer sub directories from folder path with normal path', () => {
      const fileMapper = new FileMapper();
      const mapper = (fileMapper as unknown) as {
        fileMappings: Record<string, unknown>;
        generateStripSubDirsRegex: () => void;
      };
      mapper.fileMappings['test'] = {
        pathPrefix: 'test',
      };
      mapper.generateStripSubDirsRegex();

      // action
      const cleanPath = fileMapper.stripSubDirs(normalize('a/test/b/test'));

      // expectation
      expect(cleanPath).toEqual(normalize('a/test/b'));
    });

    it('remove layer sub directories from folder path with nested path', () => {
      const fileMapper = new FileMapper();
      const mapper = (fileMapper as unknown) as {
        fileMappings: Record<string, unknown>;
        generateStripSubDirsRegex: () => void;
      };
      mapper.fileMappings['test'] = {
        pathPrefix: 'b/test',
      };
      mapper.generateStripSubDirsRegex();

      // action
      const cleanPath = fileMapper.stripSubDirs(normalize('a/b/test/a/b/test'));

      // expectation
      expect(cleanPath).toEqual(normalize('a/b/test/a'));
    });

    it("don't change path when no sub dirs are present", () => {
      const fileMapper = new FileMapper();
      const path = normalize('a/test/b/test');
      // action
      const cleanPath = fileMapper.stripSubDirs(path);

      // expectation
      expect(cleanPath).toEqual(path);
    });
  });

  describe('getFilePath', () => {
    it('returns file name and extension when not mapped', () => {
      const fileMapper = new FileMapper();

      // action
      const cleanPath = fileMapper.getFilePath('test', 'a');

      // expectation
      expect(cleanPath).toEqual('test.a');
    });

    it('returns file path when mapped', () => {
      const fileMapper = new FileMapper();
      const mappings = ((fileMapper as unknown) as { fileMappings: Record<string, unknown> }).fileMappings;
      mappings['test'] = {
        pathPrefix: 'b/test',
        fileExtension: 'ext',
      };

      // action
      const cleanPath = fileMapper.getFilePath('test', 'test');

      // expectation
      expect(cleanPath).toEqual(normalize('b/test/test.ext'));
    });
  });
});
