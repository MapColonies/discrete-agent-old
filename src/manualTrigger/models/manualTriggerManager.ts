import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { Trigger } from '../../layerCreator/models/trigger';

@injectable()
export class ManualTriggerManager {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger, private readonly trigger: Trigger) {}

  public async createLayer(sourceDirectory: string): Promise<void> {
    this.logger.log('info', `layer creation manual trigger from '${sourceDirectory}'`);
    await this.trigger.trigger(sourceDirectory);
  }
}
