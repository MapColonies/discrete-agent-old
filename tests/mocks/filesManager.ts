import { FilesManager } from '../../src/layerCreator/models/filesManager';

const validateShpFilesExistsMock = jest.fn();
const validateLayerFilesExistsMock = jest.fn();
const readAllLinesMock = jest.fn();
const fileExistsMock = jest.fn();
const readAsStringSyncMock = jest.fn();

const filesManagerMock = ({
  validateShpFilesExists: validateShpFilesExistsMock,
  validateLayerFilesExists: validateLayerFilesExistsMock,
  fileExists: fileExistsMock,
  readAllLines: readAllLinesMock,
  readAsStringSync: readAsStringSyncMock,
} as unknown) as FilesManager;
export { validateShpFilesExistsMock, validateLayerFilesExistsMock, fileExistsMock, readAllLinesMock, readAsStringSyncMock, filesManagerMock };
