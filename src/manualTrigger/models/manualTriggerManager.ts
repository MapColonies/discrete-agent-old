import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';

@injectable()
export class ManualTriggerManager {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger) {}

  public createLayer(sourceDirectory: string): void {
    //TODO: add logic
    this.logger.log('info', `layer creation manual trigger from '${sourceDirectory}'`);
  }
}
