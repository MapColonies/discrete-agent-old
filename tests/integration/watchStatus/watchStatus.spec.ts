import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { registerTestValues } from '../testContainerConfig';
// eslint-disable-next-line jest/no-mocks-import
import { removeAllListenersMock, onMock, resetMocks } from '../../__mocks__/chokidar';
import { Watcher } from '../../../src/watcher/watcher';
import * as requestSender from './helpers/requestSender';

interface StatusResponse {
  watching: boolean;
}
describe('watchStatus', function () {
  let watcher: Watcher;

  beforeAll(function () {
    registerTestValues();
    requestSender.init();
    watcher = container.resolve<Watcher>(Watcher);
  });
  beforeEach(function () {
    resetMocks();
  });
  afterEach(function () {
    container.clearInstances();
  });

  describe('Happy Path', function () {
    it('status should return watching true when watching', async function () {
      //TODO: this should be replaced with mock of the status persistent service
      ((watcher as unknown) as { watching: boolean }).watching = true;

      const response = await requestSender.getStatus();
      const body = response.body as StatusResponse;
      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.watching).toBe(true);
    });

    it('status should return watching false when not watching', async function () {
      //TODO: this should be replaced with mock of the status persistent service
      ((watcher as unknown) as { watching: boolean }).watching = false;

      const response = await requestSender.getStatus();
      const body = response.body as StatusResponse;
      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.watching).toBe(false);
    });

    it('start should start watcher when not watching', async function () {
      //TODO: this should be replaced with mock of the status persistent service
      ((watcher as unknown) as { watching: boolean }).watching = false;

      const response = await requestSender.startWatching();
      const body = response.body as StatusResponse;
      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.watching).toBe(true);
      expect(onMock).toHaveBeenCalledTimes(1);
    });

    it('start should not start watcher when already watching', async function () {
      //TODO: this should be replaced with mock of the status persistent service
      ((watcher as unknown) as { watching: boolean }).watching = true;

      const response = await requestSender.startWatching();
      const body = response.body as StatusResponse;
      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.watching).toBe(true);
      expect(onMock).toHaveBeenCalledTimes(0);
    });

    it('stop should stop watcher when watching', async function () {
      //TODO: this should be replaced with mock of the status persistent service
      ((watcher as unknown) as { watching: boolean }).watching = true;

      const response = await requestSender.stopWatching();
      const body = response.body as StatusResponse;
      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.watching).toBe(false);
      expect(removeAllListenersMock).toHaveBeenCalledTimes(1);
    });

    it('stop should not stop watcher when already stopped', async function () {
      //TODO: this should be replaced with mock of the status persistent service
      ((watcher as unknown) as { watching: boolean }).watching = false;

      const response = await requestSender.stopWatching();
      const body = response.body as StatusResponse;
      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.watching).toBe(false);
      expect(removeAllListenersMock).toHaveBeenCalledTimes(0);
    });
  });
});
