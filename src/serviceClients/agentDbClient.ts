import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status-codes';
import { Services } from '../common/constants';
import { ILogger } from '../common/interfaces';
import { IWatchStatus } from '../watchStatus/interfaces';
import { HistoryStatus } from '../layerCreator/historyStatus';
import { HttpError } from '../common/exceptions/http/httpError';
import { ILayerHistory } from '../layerCreator/interfaces';
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

  public async getDiscreteStatus(directory: string): Promise<ILayerHistory | undefined> {
    this.logger.log('debug', `getting history record for  ${directory}`);
    try {
      const encodedDirectory = encodeURIComponent(directory);
      return await this.get(`layers/${encodedDirectory}`);
    } catch (err) {
      const error = err as HttpError;
      if (error.status == httpStatus.NOT_FOUND) {
        return undefined;
      } else {
        this.logger.log('error', `failed to retrieve history record for ${directory}, error=${error.message}`);
        throw err;
      }
    }
  }

  public async createDiscreteStatus(directory: string): Promise<ILayerHistory> {
    this.logger.log('info', `creating history record for ${directory}`);
    try {
      const encodedDirectory = encodeURIComponent(directory);
      return await this.post(`layers/${encodedDirectory}`);
    } catch (err) {
      const error = err as Error;
      this.logger.log('error', `failed to create history record for ${directory}, error=${error.message}`);
      throw err;
    }
  }

  public async updateDiscreteStatus(directory: string, status?: HistoryStatus, id?: string, version?: string): Promise<ILayerHistory> {
    this.logger.log('info', `Update agent-DB history for ${directory}`);
    try {
      const encodedDirectory = encodeURIComponent(directory);
      const body = {
        status: status,
        id: id,
        version: version,
      };
      return await this.put(`layers/${encodedDirectory}`, body);
    } catch (err) {
      const error = err as Error;
      this.logger.log('error', `failed to update agent-DB for ${directory}, error=${error.message}`);
      throw err;
    }
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
