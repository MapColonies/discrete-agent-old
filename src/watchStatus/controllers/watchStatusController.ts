import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { IWatchStatus } from '../interfaces';
import { WatchStatusManager } from '../models/watchStatusManager';

type StatusHandler = RequestHandler<undefined, IWatchStatus>;

@injectable()
export class WatchStatusController {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger, private readonly manager: WatchStatusManager) {}

  public getStatus: StatusHandler = (req, res) => {
    const status = this.manager.getStatus();
    return res.status(httpStatus.OK).send(status);
  };

  public startWatcher: StatusHandler = async (req, res, next) => {
    try {
      const status = await this.manager.startWatching();
      return res.status(httpStatus.OK).send(status);
    } catch (err) {
      next(err);
    }
  };

  public stopWatcher: StatusHandler = async (req, res, next) => {
    try {
      const status = await this.manager.stopWatching();
      return res.status(httpStatus.OK).send(status);
    } catch (err) {
      next(err);
    }
  };
}
