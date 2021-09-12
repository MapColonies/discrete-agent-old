import { FilesManager } from '../../src/layerCreator/models/filesManager';

const readAllLinesMock = jest.fn();
const fileExistsMock = jest.fn();
const readAsStringSyncMock = jest.fn();

const filesManagerMock = ({
  fileExists: fileExistsMock,
  readAllLines: readAllLinesMock,
  readAsStringSync: readAsStringSyncMock,
} as unknown) as FilesManager;
export { fileExistsMock, readAllLinesMock, readAsStringSyncMock, filesManagerMock };
