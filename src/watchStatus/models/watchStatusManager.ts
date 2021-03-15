import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { Watcher } from '../../watcher/watcher';
import { IWatchStatus } from '../interfaces';

@injectable()
export class WatchStatusManager {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger, private readonly fileWatcher: Watcher) {}

  public getStatus(): IWatchStatus {
    return { isWatching: this.fileWatcher.isWatching() };
  }

  public async startWatching(): Promise<IWatchStatus> {
    await this.fileWatcher.startWatching();
    return this.getStatus();
  }

  public async stopWatching(): Promise<IWatchStatus> {
    await this.fileWatcher.stopWatching();
    return this.getStatus();
  }
}
