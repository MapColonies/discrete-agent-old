import { LimitingLock } from '../../src/watcher/limitingLock';

const acquireMock = jest.fn();
const isQueueEmptyMock = jest.fn();

const lockMock = {
  acquire: acquireMock,
  isQueueEmpty: isQueueEmptyMock,
} as unknown as LimitingLock;

export { lockMock, acquireMock, isQueueEmptyMock };
