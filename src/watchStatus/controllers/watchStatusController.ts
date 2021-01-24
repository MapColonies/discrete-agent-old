import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { IStatusResponse } from '../interfaces';
import { WatchStatusManager } from '../models/watchStatusManager';

type StatusHandler = RequestHandler<undefined, IStatusResponse>;

@injectable()
export class WatchStatusController {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger, private readonly manager: WatchStatusManager) {}

  public getStatus: StatusHandler = (req, res) => {
    const status = this.manager.getStatus();
    return res.status(httpStatus.OK).send(status);
  };

  public startWatcher: StatusHandler = (req, res) => {
    const status = this.manager.startWatching();
    return res.status(httpStatus.OK).send(status);
  };

  public stopWatcher: StatusHandler = (req, res) => {
    const status = this.manager.stopWatching();
    return res.status(httpStatus.OK).send(status);
  };
}
