import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';

import { ManualTriggerManager } from '../models/manualTriggerManager';

interface IManualTriggerParams {
  sourceDirectory: string;
}
type CreateLayerHandler = RequestHandler<undefined, undefined, IManualTriggerParams>;

@injectable()
export class ManualTriggerController {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger, private readonly manager: ManualTriggerManager) {}

  public createLayer: CreateLayerHandler = (req, res) => {
    this.manager.createLayer(req.body.sourceDirectory);
    return res.sendStatus(httpStatus.OK);
  };
}
