import { FileMapper } from '../../src/layerCreator/models/fileMapper';

const stripSubDirsMock = jest.fn();
const getFilePathMock = jest.fn();

const fileMapperMock = {
  stripSubDirs: stripSubDirsMock,
  getFilePath: getFilePathMock,
} as unknown as FileMapper;

export { fileMapperMock, stripSubDirsMock, getFilePathMock };
