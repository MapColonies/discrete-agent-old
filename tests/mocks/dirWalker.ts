import { DirWalker } from '../../src/common/utilities/dirWalker';

const walkMock = jest.fn();
const findFileMock = jest.fn();

const dirWalkerMock = {
  walk: walkMock,
  findFile: findFileMock,
} as unknown as DirWalker;

export { dirWalkerMock, walkMock, findFileMock };
