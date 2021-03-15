import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import { Services } from '../common/constants';
import { ILogger } from '../common/interfaces';
import { IWatchStatus } from '../watchStatus/interfaces';
import { HttpClient, IHttpRetryConfig, parseConfig } from './clientBase/httpClient';

@injectable()
export class DBClient extends HttpClient {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public constructor(@inject(Services.LOGGER) protected readonly logger: ILogger, @inject(Services.CONFIG) private readonly config: IConfig) {
    const retryConfig = parseConfig(config.get<IHttpRetryConfig>('httpRetry'));
    super(logger, retryConfig);
    this.targetService = 'discrete-agent-db'; //name of target for logs
    this.axiosOptions.baseURL = config.get<string>('agentDB.url');
  }

  public async getWatchStatus(): Promise<IWatchStatus> {
    try {
      return await this.get('/status');
    } catch (err) {
      const error = err as Error;
      this.logger.log('error', `failed to retrieve watch status from db, error=${error.message}`);
      throw err;
    }
  }

  public async setWatchStatus(status: IWatchStatus): Promise<IWatchStatus> {
    try {
      return await this.put('/status', status);
    } catch (err) {
      const error = err as Error;
      this.logger.log('error', `failed to retrieve watch status from db, error=${error.message}`);
      throw err;
    }
  }
}
