import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { registerTestValues } from '../testContainerConfig';
import { getWatchStatusMock, setWatchStatusMock } from '../../mocks/clients/agentDbClient';
import { Watcher } from '../../../src/watcher/watcher';
import { registerDefaultConfig } from '../../mocks/config';
import { directoryExistsMock } from '../../mocks/filesManager';
import * as requestSender from './helpers/requestSender';

interface StatusResponse {
  isWatching: boolean;
}

describe('watchStatus', function () {
  const internalStartWatchMock = jest.fn();
  let watcherStatus: { watching: boolean };
  let watcher: Watcher;

  beforeAll(function () {
    registerTestValues();
    watcher = container.resolve(Watcher);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
    (watcher as any).internalStartWatch = internalStartWatchMock;
    watcherStatus = watcher as unknown as { watching: boolean };
    requestSender.init();
  });

  beforeEach(function () {
    internalStartWatchMock.mockImplementation(() => {
      watcherStatus.watching = true;
    });
    registerDefaultConfig();
    directoryExistsMock.mockReturnValue(true);
  });

  afterEach(function () {
    container.clearInstances();
    jest.resetAllMocks();
  });

  describe('Happy Path', function () {
    it('status should return watching true when watching', async function () {
      watcherStatus.watching = true;

      const response = await requestSender.getStatus();
      const body = response.body as StatusResponse;

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.isWatching).toBe(true);
    });

    it('status should return watching false when not watching', async function () {
      watcherStatus.watching = false;

      const response = await requestSender.getStatus();
      const body = response.body as StatusResponse;

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.isWatching).toBe(false);
    });

    it('start should start watcher when not watching', async function () {
      watcherStatus.watching = false;
      setWatchStatusMock.mockResolvedValue({ isWatching: true });
      getWatchStatusMock.mockImplementation(() => {
        return {
          isWatching: watcherStatus.watching,
        };
      });

      const response = await requestSender.startWatching();
      const body = response.body as StatusResponse;

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.isWatching).toBe(true);
      expect(internalStartWatchMock).toHaveBeenCalledTimes(1);
      expect(watcherStatus.watching).toBe(true);
      expect(setWatchStatusMock).toHaveBeenCalledWith({ isWatching: true });
    });

    it('start should not start watcher when already watching', async function () {
      watcherStatus.watching = true;

      const response = await requestSender.startWatching();
      const body = response.body as StatusResponse;

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.isWatching).toBe(true);
      expect(internalStartWatchMock).toHaveBeenCalledTimes(0);
      expect(setWatchStatusMock).toHaveBeenCalledTimes(1);
    });

    it('stop should stop watcher when watching', async function () {
      watcherStatus.watching = true;
      getWatchStatusMock.mockResolvedValue({ isWatching: true });
      setWatchStatusMock.mockResolvedValue({ isWatching: false });

      const response = await requestSender.stopWatching();
      const body = response.body as StatusResponse;

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.isWatching).toBe(false);
      expect(watcherStatus.watching).toBe(false);
      expect(setWatchStatusMock).toHaveBeenCalledWith({ isWatching: false });
    });
  });
});
