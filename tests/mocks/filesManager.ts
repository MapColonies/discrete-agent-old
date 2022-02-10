import { FilesManager } from '../../src/layerCreator/models/filesManager';

const validateShpFilesExistsMock = jest.fn();
const validateLayerFilesExistsMock = jest.fn();
const readAllLinesMock = jest.fn();
const fileExistsMock = jest.fn();
const readAsStringMock = jest.fn();
const readAsStringSyncMock = jest.fn();
const readS3ObjectAsStringMock = jest.fn();

const filesManagerMock = {
  validateShpFilesExists: validateShpFilesExistsMock,
  validateLayerFilesExists: validateLayerFilesExistsMock,
  fileExists: fileExistsMock,
  readAllLines: readAllLinesMock,
  readAsString: readAsStringMock,
  readAsStringSync: readAsStringSyncMock,
  readS3ObjectAsString: readS3ObjectAsStringMock,
} as unknown as FilesManager;
export {
  validateShpFilesExistsMock,
  validateLayerFilesExistsMock,
  fileExistsMock,
  readAllLinesMock,
  readAsStringMock,
  readAsStringSyncMock,
  readS3ObjectAsStringMock,
  filesManagerMock,
};
