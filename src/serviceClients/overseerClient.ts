import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import { LayerMetadata } from '@map-colonies/mc-model-types';
import { Services } from '../common/constants';
import { ILogger } from '../common/interfaces';
import { HttpClient, IHttpRetryConfig, parseConfig } from './clientBase/httpClient';

@injectable()
export class OverseerClient extends HttpClient {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public constructor(@inject(Services.LOGGER) protected readonly logger: ILogger, @inject(Services.CONFIG) private readonly config: IConfig) {
    const retryConfig = parseConfig(config.get<IHttpRetryConfig>('httpRetry'));
    super(logger, retryConfig);
    this.targetService = 'OverseerService'; //name of target for logs
    this.axiosOptions.baseURL = config.get<string>('overseer.url');
  }

  public async ingestDiscreteLayer(discreteLayerMetaData: LayerMetadata): Promise<LayerMetadata> {
    this.logger.log('info', `Trigger overseer for id: ${discreteLayerMetaData.id as string} version: ${discreteLayerMetaData.version as string}`);
    try {
      return await this.post('/layers', discreteLayerMetaData);
    } catch (err) {
      const error = err as Error;
      this.logger.log(
        'error',
        `failed to trigger overseer for for id=${discreteLayerMetaData.id as string} version=${discreteLayerMetaData.version as string}, error=${
          error.message
        }`
      );
      throw err;
    }
  }
}