import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { registerTestValues } from '../testContainerConfig';
// eslint-disable-next-line jest/no-mocks-import
import { removeAllListenersMock, onMock, resetMocks } from '../../__mocks__/chokidar';
import { getWatchStatusMock, setWatchStatusMock } from '../../mocks/clients/dbClient';
import { Watcher } from '../../../src/watcher/watcher';
import * as requestSender from './helpers/requestSender';

interface StatusResponse {
  isWatching: boolean;
}
describe('watchStatus', function () {
  let watcher: Watcher;
  beforeAll(function () {
    registerTestValues();
    watcher = container.resolve(Watcher);
    requestSender.init();
  });
  beforeEach(function () {
    resetMocks();
  });
  afterEach(function () {
    container.clearInstances();
    jest.resetAllMocks();
  });

  describe('Happy Path', function () {
    it('status should return watching true when watching', async function () {
      ((watcher as unknown) as { watching: boolean }).watching = true;

      const response = await requestSender.getStatus();
      const body = response.body as StatusResponse;

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.isWatching).toBe(true);
    });

    it('status should return watching false when not watching', async function () {
      ((watcher as unknown) as { watching: boolean }).watching = false;

      const response = await requestSender.getStatus();
      const body = response.body as StatusResponse;

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.isWatching).toBe(false);
    });

    it('start should start watcher when not watching', async function () {
      ((watcher as unknown) as { watching: boolean }).watching = false;
      setWatchStatusMock.mockResolvedValue({ isWatching: true });
      getWatchStatusMock.mockImplementation(() => {
        return {
          isWatching: ((watcher as unknown) as { watching: boolean }).watching,
        };
      });

      const response = await requestSender.startWatching();
      const body = response.body as StatusResponse;

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.isWatching).toBe(true);
      expect(onMock).toHaveBeenCalledTimes(1);
      expect(setWatchStatusMock).toHaveBeenCalledWith({ isWatching: true });
    });

    it('start should not start watcher when already watching', async function () {
      ((watcher as unknown) as { watching: boolean }).watching = true;

      const response = await requestSender.startWatching();
      const body = response.body as StatusResponse;

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.isWatching).toBe(true);
      expect(onMock).toHaveBeenCalledTimes(0);
      expect(setWatchStatusMock).toHaveBeenCalledTimes(0);
    });

    it('stop should stop watcher when watching', async function () {
      getWatchStatusMock.mockResolvedValue({ isWatching: true });
      setWatchStatusMock.mockResolvedValue({ isWatching: false });

      const response = await requestSender.stopWatching();
      const body = response.body as StatusResponse;

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.isWatching).toBe(false);
      expect(removeAllListenersMock).toHaveBeenCalledTimes(1);
      expect(setWatchStatusMock).toHaveBeenCalledWith({ isWatching: false });
    });

    it('stop should not stop watcher when already stopped', async function () {
      getWatchStatusMock.mockResolvedValue({ isWatching: false });

      const response = await requestSender.stopWatching();
      const body = response.body as StatusResponse;
      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.isWatching).toBe(false);
      expect(removeAllListenersMock).toHaveBeenCalledTimes(0);
      expect(setWatchStatusMock).toHaveBeenCalledTimes(0);
    });
  });
});
