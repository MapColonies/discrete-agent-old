import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import { LayerMetadata } from '@map-colonies/mc-model-types';
import { Services } from '../common/constants';
import { ILogger } from '../common/interfaces';
import { HttpClient, IHttpRetryConfig, parseConfig } from './clientBase/httpClient';

@injectable()
export class AgentDbClient extends HttpClient {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public constructor(@inject(Services.LOGGER) protected readonly logger: ILogger, @inject(Services.CONFIG) private readonly config: IConfig) {
    const retryConfig = parseConfig(config.get<IHttpRetryConfig>('httpRetry'));
    super(logger, retryConfig);
    this.targetService = 'AgentDbService'; //name of target for logs
    this.axiosOptions.baseURL = config.get<string>('agentDB.url');
  }

  public async updateDiscreteStatus(discreteLayerMetaData: LayerMetadata): Promise<LayerMetadata> {
    this.logger.log('info', `Update agent-DB history for id: ${discreteLayerMetaData.id as string} version: ${discreteLayerMetaData.version as string}`);
    try {
        return await this.post(`${discreteLayerMetaData.id as string}/${discreteLayerMetaData.version as string}`);
    } catch (err) {
      const error = err as Error;
      this.logger.log(
        'error',
        `failed to update agent-DB for for id=${discreteLayerMetaData.id as string} version=${discreteLayerMetaData.version as string}, error=${error.message}`
      );
      throw err;
    }
  }
}
