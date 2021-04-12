import { dirname, join as joinPath } from 'path';
import { watch, FSWatcher, WatchOptions } from 'chokidar';
import { inject, singleton } from 'tsyringe';
import { cloneDeep, toInteger } from 'lodash';
import { IConfig, ILogger } from '../common/interfaces';
import { Services } from '../common/constants';
import { Trigger } from '../layerCreator/models/trigger';
import { AgentDbClient } from '../serviceClients/agentDbClient';

@singleton()
export class Watcher {
  private readonly watcher: FSWatcher;
  private watching: boolean;

  public constructor(
    @inject(Services.CONFIG) private readonly config: IConfig,
    @inject(Services.LOGGER) private readonly logger: ILogger,
    private readonly dbClient: AgentDbClient,
    private readonly trigger: Trigger
  ) {
    const mountDir = config.get<string>('mountDir');
    const watchDir = config.get<string>('watcher.watchDirectory');
    const watchTarget = joinPath(mountDir, watchDir);
    const watchOptions = this.getWatchOptions(config);

    this.watcher = watch(watchTarget, watchOptions);
    process.on('beforeExit', () => {
      void this.watcher.close();
    });
    this.watching = false;
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
    if (watchOptions.interval != undefined) {
      watchOptions.interval = toInteger(watchOptions.interval);
    }
    if (
      watchOptions.awaitWriteFinish != undefined &&
      typeof watchOptions.awaitWriteFinish != 'boolean' &&
      watchOptions.awaitWriteFinish.stabilityThreshold != undefined
    ) {
      watchOptions.awaitWriteFinish.stabilityThreshold = toInteger(watchOptions.awaitWriteFinish.stabilityThreshold);
    }
    if (
      watchOptions.awaitWriteFinish != undefined &&
      typeof watchOptions.awaitWriteFinish != 'boolean' &&
      watchOptions.awaitWriteFinish.pollInterval != undefined
    ) {
      watchOptions.awaitWriteFinish.pollInterval = toInteger(watchOptions.awaitWriteFinish.pollInterval);
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
    void this.trigger.trigger(dir).catch((err) => {
      const error = err as Error;
      this.logger.log('error', `failed to trigger layer for ${path}. error: ${error.message}`);
    });
  }
}
