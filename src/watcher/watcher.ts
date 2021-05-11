import { dirname, join as joinPath } from 'path';
import { promises } from 'fs';
import { watch, FSWatcher, WatchOptions } from 'chokidar';
import { inject, singleton } from 'tsyringe';
import { cloneDeep, toInteger } from 'lodash';
import { IConfig, ILogger } from '../common/interfaces';
import { Services } from '../common/constants';
import { Trigger } from '../layerCreator/models/trigger';
import { AgentDbClient } from '../serviceClients/agentDbClient';
import { toBoolean } from '../common/utilities/typeConvertors';
import { AsyncLockDoneCallback, LimitingLock } from './limitingLock';

@singleton()
export class Watcher {
  private readonly watcher: FSWatcher;
  private watching: boolean;
  private readonly watcherDelay: number;
  private readonly watchTarget: string;

  public constructor(
    @inject(Services.CONFIG) private readonly config: IConfig,
    @inject(Services.LOGGER) private readonly logger: ILogger,
    private readonly dbClient: AgentDbClient,
    private readonly trigger: Trigger,
    private readonly lock: LimitingLock
  ) {
    const mountDir = config.get<string>('mountDir');
    const watchDir = config.get<string>('watcher.watchDirectory');
    this.watchTarget = joinPath(mountDir, watchDir);
    const watchOptions = this.getWatchOptions(config);

    this.watcher = watch(this.watchTarget, watchOptions);
    process.on('beforeExit', () => {
      void this.watcher.close();
    });
    this.watching = false;
    //TODO: read from config
    this.watcherDelay = 10000;

    void this.dbClient.getWatchStatus().then((data) => {
      this.watching = data.isWatching;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (this.watching) {
        this.internalStartWatch();
      }
    });
  }

  public async stopWatching(): Promise<void> {
    if (this.watching) {
      this.logger.log('info', 'stopping file watcher');
      this.watcher.removeAllListeners();
      this.watching = false;
    }
    await this.dbClient.setWatchStatus({
      isWatching: this.watching,
    });
  }

  public async startWatching(): Promise<void> {
    if (!this.watching) {
      this.internalStartWatch();
    }
    await this.dbClient.setWatchStatus({
      isWatching: this.watching,
    });
  }

  public isWatching(): boolean {
    return this.watching;
  }

  private getWatchOptions(config: IConfig): WatchOptions {
    const options = config.get<WatchOptions>('watcher.watchOptions');
    const watchOptions = cloneDeep(options);
    if (watchOptions.depth != undefined) {
      watchOptions.depth = toInteger(watchOptions.depth);
    }
    if (watchOptions.persistent != undefined) {
      watchOptions.persistent = toBoolean(watchOptions.persistent);
    }
    if (watchOptions.useFsEvents != undefined) {
      watchOptions.useFsEvents = toBoolean(watchOptions.useFsEvents);
    }
    if (watchOptions.usePolling != undefined) {
      watchOptions.usePolling = toBoolean(watchOptions.usePolling);
    }
    if (watchOptions.interval != undefined) {
      watchOptions.interval = toInteger(watchOptions.interval);
    }
    if (watchOptions.awaitWriteFinish != undefined) {
      if (typeof watchOptions.awaitWriteFinish === 'object') {
        if (watchOptions.awaitWriteFinish.stabilityThreshold != undefined) {
          watchOptions.awaitWriteFinish.stabilityThreshold = toInteger(watchOptions.awaitWriteFinish.stabilityThreshold);
        }
        if (watchOptions.awaitWriteFinish.pollInterval != undefined) {
          watchOptions.awaitWriteFinish.pollInterval = toInteger(watchOptions.awaitWriteFinish.pollInterval);
        }
      } else {
        watchOptions.awaitWriteFinish = toBoolean(watchOptions.awaitWriteFinish);
      }
    }

    return watchOptions;
  }

  private internalStartWatch(): void {
    this.logger.log('info', 'starting file watcher');
    this.watcher.on('add', this.onAdd.bind(this));
    this.watching = true;
  }

  private onAdd(path: string): void {
    const dir = dirname(path);
    const action = async (done: AsyncLockDoneCallback<void>): Promise<void> => {
      try {
        this.logger.log('debug', `starting trigger flow for ${dir}`);
        await this.trigger.trigger(dir);
        return done();
      } catch (err) {
        const error = err as Error;
        this.logger.log('error', `failed to trigger layer for ${path}. error: ${error.message}`);
        return done(err);
      }
    };
    this.logger.log('debug', `watch triggered for ${path}`);
    void this.lock.acquire(dir, action);
  }

  private startIteration(): void {
    void this.walkDir(this.watchTarget);
  }

  private async walkDir(path: string, depth = 0): Promise<void> {
    const dir = await promises.opendir(path);
    for await (const dirent of dir) {
      if (dirent.isDirectory()) {
        //TODO: add limit on depth
        await this.walkDir(dirent.name);
      } else if (dirent.isFile()) {
        this.onAdd(dirent.name);
      }
    }
    if (depth === 0 && this.isWatching()) {
      setTimeout(this.startIteration.bind(this), this.watcherDelay);
    }
  }
}
