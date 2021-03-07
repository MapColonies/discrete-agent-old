import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import { Services } from '../common/constants';
import { NotFoundError } from '../common/exceptions/http/notFoundError';
import { ILogger } from '../common/interfaces';
import { LayerMetadata } from '@map-colonies/mc-model-types';
import { HttpClient, IHttpRetryConfig, parseConfig } from './clientBase/httpClient';

@injectable()
export class OverseerClient extends HttpClient {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public constructor(@inject(Services.LOGGER) protected readonly logger: ILogger, @inject(Services.CONFIG) private config: IConfig) {
    const retryConfig = parseConfig(config.get<IHttpRetryConfig>('httpRetry'));
    super(logger, retryConfig);
    this.targetService = 'OverseerService'; //name of target for logs
    this.axiosOptions.baseURL = config.get<string>('overseer.url');
  }

  public async ingestDiscreteLayer(discreteLayerMetaData: LayerMetadata): Promise<LayerMetadata> {
    this.logger.log('info', `Trigger overseer for id: ${discreteLayerMetaData.id as string} version: ${discreteLayerMetaData.version as string}`);
    const overseerUrlPath = this.config.get<string>('overseer.url');
    try {
      return this.post('/layers', discreteLayerMetaData);
    } catch (err) {
      const error = err as Error;
      this.logger.log('error', `failed to trigger overseer for for id=${discreteLayerMetaData.id as string} version=${discreteLayerMetaData.version as string}, error=${error.message}`);
      //TODO: add custom error
      throw err;
    }
  }
}
