import { FilesManager } from '../../src/layerCreator/models/filesManager';
import { opendirMock } from './fs/opendir';

const readAllLinesMock = jest.fn();
const fileExistsMock = jest.fn();

const directoryExistsMock = jest.fn();
const readAsStringMock = jest.fn();
const readAsStringSyncMock = jest.fn();
const readS3ObjectAsStringMock = jest.fn();
const openDirMock = opendirMock;

const filesManagerMock = {
  fileExists: fileExistsMock,
  directoryExists: directoryExistsMock,
  readAllLines: readAllLinesMock,
  readAsString: readAsStringMock,
  readAsStringSync: readAsStringSyncMock,
  readS3ObjectAsString: readS3ObjectAsStringMock,
  openDir: openDirMock,
} as unknown as FilesManager;
export {
  fileExistsMock,
  directoryExistsMock,
  readAllLinesMock,
  readAsStringMock,
  readAsStringSyncMock,
  readS3ObjectAsStringMock,
  openDirMock,
  filesManagerMock,
};
