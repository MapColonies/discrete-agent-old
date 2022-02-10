import { join as joinPath } from 'path';
import { Watcher } from '../../../src/watcher/watcher';
import { configMock, getMock } from '../../mocks/config';
import { agentDbClientMock, setWatchStatusMock, init as initDb } from '../../mocks/clients/agentDbClient';
import { triggerMock, triggerFunctionMock } from '../../mocks/trigger';
import { lockMock, acquireMock } from '../../mocks/limitingLock';
import { opendirMock, init as initFsMock } from '../../mocks/fs/opendir';
import { AsyncLockDoneCallback } from '../../../src/watcher/limitingLock';

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
    watcher = new Watcher(configMock, loggerMock, agentDbClientMock, triggerMock, lockMock);
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
      initFsMock({
        mountDir: {
          watch: {
            a: {
              b: {
                c: {
                  d: {},
                },
              },
              file: 'file',
            },
          },
        },
      });

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
    it('scans the configured watch location', async () => {
      initFsMock({});

      await triggerWalkerOnce(watcher);

      const expectedPath = joinPath(configData['mountDir'] as string, configData['watcher.watchDirectory'] as string);
      expect(opendirMock).toHaveBeenCalledTimes(1);
      expect(opendirMock).toHaveBeenCalledWith(expectedPath);
    });

    it('stops at configured max depth', async () => {
      initFsMock({
        mountDir: {
          watch: {
            a: {
              b: {
                c: {
                  d: {},
                },
              },
            },
          },
        },
      });

      await triggerWalkerOnce(watcher);

      expect(opendirMock).toHaveBeenCalledTimes(3);
    });

    it('should only trigger for files after the min trigger depth', async () => {
      initFsMock({
        file1: 'file',
        unmountedDir: {
          file2: 'file',
          watch: {
            file3: 'file',
            dir: {
              file4: 'file',
            },
            fakeWatch: {
              file5: 'file',
              dir: {
                file6: 'file',
              },
            },
          },
        },
        mountDir: {
          file7: 'file',
          unWatched: {
            file8: 'file',
            dir: {
              file9: 'file',
            },
          },
          watch: {
            file10: 'file',
            dir: {
              file11: 'file',
              subdir: {
                file12: 'file',
              },
            },
          },
        },
      });
      // eslint-disable-next-line @typescript-eslint/ban-types
      acquireMock.mockImplementation(async (dir: string, action: (done: AsyncLockDoneCallback<void>) => Promise<void>) => {
        await action(jest.fn() as AsyncLockDoneCallback<void>);
      });

      await triggerWalkerOnce(watcher);

      expect(triggerFunctionMock).toHaveBeenCalledTimes(2);
      expect(triggerFunctionMock).toHaveBeenCalledWith(joinPath('/mountDir', 'watch', 'dir'));
      expect(triggerFunctionMock).toHaveBeenCalledWith(joinPath('/mountDir', 'watch', 'dir', 'subdir'));
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
