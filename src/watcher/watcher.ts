import { watch, FSWatcher, WatchOptions } from 'chokidar';
import { inject, singleton } from 'tsyringe';
import { IConfig, ILogger } from '../common/interfaces';
import { Services } from '../common/constants';

@singleton()
export class Watcher {
  private readonly watcher: FSWatcher;
  private watching: boolean;

  public constructor(@inject(Services.CONFIG) private readonly config: IConfig, @inject(Services.LOGGER) private readonly logger: ILogger) {
    const watchDir = config.get<string>('watcher.watchDirectory');
    const watchOptions = config.get<WatchOptions>('watcher.watchOptions');
    this.watcher = watch(watchDir, watchOptions);
    this.watching = true; //TODO: replace with getting watch status from persistent storage
    process.on('beforeExit', () => {
      void this.watcher.close();
    });
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.watching) {
      this.startWatching();
    }
  }

  public stopWatching(): void {
    if (this.watching) {
      this.logger.log('info', 'stopping file watcher');
      //TODO: update persistent storage on status change
      this.watcher.removeAllListeners();
      this.watching = false;
    }
  }

  public startWatching(): void {
    if (!this.watching) {
      this.logger.log('info', 'starting file watcher');
      //TODO: update persistent storage on status change
      this.watcher.on('add', this.onAdd.bind(this));
      this.watching = true;
    }
  }

  public isWatching(): boolean {
    return this.watching;
  }

  private onAdd(path: string): void {
    //TODO: trigger logic
  }
}
