import { join as joinPath } from 'path';
import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import { IConfig, ILogger } from '../../common/interfaces';
import { Trigger } from '../../layerCreator/models/trigger';

@injectable()
export class ManualTriggerManager {
  public constructor(
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(Services.CONFIG) private readonly config: IConfig,
    private readonly trigger: Trigger
  ) {}

  public async createLayer(sourceDirectory: string): Promise<void> {
    this.logger.log('info', `layer creation manual trigger from '${sourceDirectory}'`);
    const mountDir = this.config.get<string>('mountDir');
    const targetDir = joinPath(mountDir, sourceDirectory);

    await this.trigger.trigger(targetDir, true);
  }
}
