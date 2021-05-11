import { dirname, join as joinPath } from 'path';
import { promises } from 'fs';
import { inject, singleton } from 'tsyringe';
import { toInteger } from 'lodash';
import { IConfig, ILogger } from '../common/interfaces';
import { Services } from '../common/constants';
import { Trigger } from '../layerCreator/models/trigger';
import { AgentDbClient } from '../serviceClients/agentDbClient';
import { AsyncLockDoneCallback, LimitingLock } from './limitingLock';

interface WatchOptions {
  minTriggerDepth: number;
  maxWatchDepth: number;
  interval: number;
}
@singleton()
export class Watcher {
  private watching: boolean;
  private readonly watchTarget: string;
  private watcherInterval!: number;
  private minTriggerDepth!: number;
  private maxWatchDepth!: number;

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

    this.watching = false;
    this.loadWatchOptions(config);

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

  private loadWatchOptions(config: IConfig): void {
    const options = config.get<WatchOptions>('watcher.watchOptions');
    this.minTriggerDepth = toInteger(options.minTriggerDepth);
    this.maxWatchDepth = toInteger(options.maxWatchDepth);
    this.watcherInterval = toInteger(options.interval);
  }

  private internalStartWatch(): void {
    this.logger.log('info', 'starting file watcher');
    this.watching = true;
    setTimeout(this.startIteration.bind(this), this.watcherInterval);
  }

  private triggerFile(path: string): void {
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
        if (this.maxWatchDepth > depth) {
          await this.walkDir(dirent.name, depth++);
        }
      } else if (dirent.isFile()) {
        if (this.minTriggerDepth <= depth) {
          this.triggerFile(dirent.name);
        }
      }
    }
    if (depth === 0 && this.isWatching()) {
      setTimeout(this.startIteration.bind(this), this.watcherInterval);
    }
  }
}
