import { FilesManager } from '../../src/layerCreator/models/filesManager';
import { opendirMock } from './fs/opendir';

const readAllLinesMock = jest.fn();
const fileExistsMock = jest.fn();
const directoryExistsMock = jest.fn();
const readAsStringSyncMock = jest.fn();
const openDirMock = opendirMock;

const filesManagerMock = {
  fileExists: fileExistsMock,
  directoryExists: directoryExistsMock,
  readAllLines: readAllLinesMock,
  readAsStringSync: readAsStringSyncMock,
  openDir: openDirMock,
} as unknown as FilesManager;
export { fileExistsMock, directoryExistsMock, readAllLinesMock, readAsStringSyncMock, openDirMock, filesManagerMock };
