import { watch, FSWatcher, WatchOptions } from 'chokidar';
import { inject } from 'tsyringe';
import { IConfig } from '../common/interfaces';
import { Services } from '../common/constants';

export class Watcher {
  private readonly watcher: FSWatcher;
  private watching: boolean;

  public constructor(@inject(Services.CONFIG) private readonly config: IConfig) {
    const watchDir = config.get<string>('watch.watchDirectory');
    const watchOptions = config.get<WatchOptions>('watch.watchOptions');
    this.watcher = watch(watchDir, watchOptions);
    this.watching = true;
    process.on('beforeExit', () => {
      void this.watcher.close();
    });
  }

  public stopWatching(): void {
    if (this.watching) {
      this.watcher.removeAllListeners();
      this.watching = false;
    }
  }

  public startWatching(): void {
    if (!this.watching) {
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
