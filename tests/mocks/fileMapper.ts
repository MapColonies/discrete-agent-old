import { FileMapper } from '../../src/layerCreator/models/fileMapper';

const getFilePathMock = jest.fn();
const getRootDirMock = jest.fn();
const getFileFullPathMock = jest.fn();
const findFilesRelativePathsMock = jest.fn();

const fileMapperMock = ({
  getFilePath: getFilePathMock,
  getRootDir: getRootDirMock,
  getFileFullPath: getFileFullPathMock,
  findFilesRelativePaths: findFilesRelativePathsMock,
} as unknown) as FileMapper;

export { fileMapperMock, getFilePathMock, getRootDirMock, getFileFullPathMock, findFilesRelativePathsMock };
