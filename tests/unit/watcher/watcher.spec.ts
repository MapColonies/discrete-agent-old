import { Watcher } from '../../../src/watcher/watcher';
import { configMock, getMock } from '../../mocks/config';
import { agentDbClientMock, setWatchStatusMock, init as initDb } from '../../mocks/clients/agentDbClient';
import { triggerMock, triggerFunctionMock } from '../../mocks/trigger';
import { lockMock, acquireMock } from '../../mocks/limitingLock';
import { opendirMock, init as initFsMock } from '../../mocks/fs/opendir';
import { AsyncLockDoneCallback } from '../../../src/watcher/limitingLock';
import { dirWalkerMock, walkMock } from '../../mocks/dirWalker';

let configData: { [key: string]: unknown } = {};
let watcher: Watcher;
const loggerMock = { log: jest.fn() };
const realTimeout = setTimeout;

describe('watcher', () => {
  beforeEach(() => {
    configData['mountDir'] = '/mountDir';
    configData['watcher.watchDirectory'] = 'watch';
    configData['watcher.watchOptions'] = {
      minTriggerDepth: 1,
      maxWatchDepth: 2,
      interval: 20,
    };
    initDb();
    getMock.mockImplementation((key: string) => configData[key]);
    jest.useFakeTimers();
    watcher = new Watcher(configMock, loggerMock, agentDbClientMock, triggerMock, lockMock, dirWalkerMock);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (watcher as any).opendir = opendirMock;
  });

  afterEach(function () {
    jest.resetAllMocks();
    jest.clearAllTimers();
    configData = {};
  });

  describe('#startWatching', () => {
    it('update db watch status and start polling', async function () {
      const watcherStatus = watcher as unknown as { watching: boolean };
      watcherStatus.watching = false;

      await watcher.startWatching();

      expect(watcherStatus.watching).toBe(true);
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setWatchStatusMock).toHaveBeenCalledTimes(1);
      expect(setWatchStatusMock).toHaveBeenCalledWith({
        isWatching: true,
      });
    });
  });

  describe('#stopWatching', () => {
    it('update db watch status', async function () {
      const watcherStatus = watcher as unknown as { watching: boolean };
      watcherStatus.watching = true;

      await watcher.stopWatching();

      expect(watcherStatus.watching).toBe(false);
      expect(setTimeout).toHaveBeenCalledTimes(0);
      expect(setWatchStatusMock).toHaveBeenCalledTimes(1);
      expect(setWatchStatusMock).toHaveBeenCalledWith({
        isWatching: false,
      });
    });
  });

  describe('#pooling', () => {
    it('trigger next pooling cycle with configured interval when watching', async function () {
      const genMock = (function* () {
        yield Promise.resolve('mountDir/watch/a/file.file');
      })();
      walkMock.mockReturnValue(genMock);

      await watcher.startWatching();
      jest.runOnlyPendingTimers();
      await sleep(20);

      expect(setTimeout).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 20);
    });

    it('wont trigger next pooling cycle when stopped', async function () {
      initFsMock({});

      await triggerWalkerOnce(watcher);

      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 20);
    });
  });

  describe('#fileWalker', () => {
    it('should only trigger for files after the min trigger depth', async () => {
      const genMock = (function* () {
        yield Promise.resolve('mountDir/watch/dir/file10.file');
        yield Promise.resolve('mountDir/watch/dir/sub/file11.file');
      })();
      walkMock.mockReturnValue(genMock);

      // eslint-disable-next-line @typescript-eslint/ban-types
      acquireMock.mockImplementation(async (dir: string, action: (done: AsyncLockDoneCallback<void>) => Promise<void>) => {
        await action(jest.fn() as AsyncLockDoneCallback<void>);
      });

      await triggerWalkerOnce(watcher);

      expect(triggerFunctionMock).toHaveBeenCalledTimes(2);
      expect(triggerFunctionMock).toHaveBeenCalledWith('mountDir/watch/dir');
      expect(triggerFunctionMock).toHaveBeenCalledWith('mountDir/watch/dir/sub');
    });
  });
});

async function sleep(ms: number) {
  return new Promise((resolve) => realTimeout(resolve, ms));
}

async function triggerWalkerOnce(watcher: Watcher) {
  await watcher.startWatching();
  await watcher.stopWatching();
  jest.runOnlyPendingTimers();
  await sleep(20);
}
