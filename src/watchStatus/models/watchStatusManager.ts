import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { Watcher } from '../../watcher/watcher';
import { IStatusResponse } from '../interfaces';

@injectable()
export class WatchStatusManager {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger, private readonly fileWatcher: Watcher) {}

  public getStatus(): IStatusResponse {
    return { watching: this.fileWatcher.isWatching() };
  }

  public startWatching(): IStatusResponse {
    this.fileWatcher.startWatching();
    return this.getStatus();
  }

  public stopWatching(): IStatusResponse {
    this.fileWatcher.stopWatching();
    return this.getStatus();
  }
}
