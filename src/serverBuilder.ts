import { mkdirSync, existsSync } from 'fs';
import express from 'express';
import bodyParser from 'body-parser';
import { getErrorHandlerMiddleware } from '@map-colonies/error-express-handler';
import { middleware as OpenApiMiddleware } from 'express-openapi-validator';
import { container, inject, injectable } from 'tsyringe';
import { RequestLogger } from './common/middlewares/RequestLogger';
import { Services } from './common/constants';
import { IConfig, ILogger } from './common/interfaces';
import { manualTriggerRouterFactory } from './manualTrigger/routes/manualTriggerRouter';
import { watchStatusRouterFactory } from './watchStatus/routes/watchStatusRouter';
import { openapiRouterFactory } from './common/routes/openapi';

@injectable()
export class ServerBuilder {
  private readonly serverInstance = express();

  public constructor(
    @inject(Services.CONFIG) private readonly config: IConfig,
    private readonly requestLogger: RequestLogger,
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(Services.WATCHER_CONFIG) private readonly realativeWatchDir: string
  ) {
    this.serverInstance = express();
  }

  public build(): express.Application {
    this.registerPreRoutesMiddleware();
    this.buildRoutes();
    this.registerPostRoutesMiddleware();
    this.createWatchDirectory();

    return this.serverInstance;
  }

  private buildRoutes(): void {
    this.serverInstance.use('/trigger', manualTriggerRouterFactory(container));
    this.serverInstance.use('/status', watchStatusRouterFactory(container));
    this.serverInstance.use('/', openapiRouterFactory(container));
  }

  private registerPreRoutesMiddleware(): void {
    this.serverInstance.use(bodyParser.json());

    const ignorePathRegex = new RegExp(`^${this.config.get<string>('openapiConfig.basePath')}/.*`, 'i');
    const apiSpecPath = this.config.get<string>('openapiConfig.filePath');
    this.serverInstance.use(OpenApiMiddleware({ apiSpec: apiSpecPath, validateRequests: true, ignorePaths: ignorePathRegex }));

    this.serverInstance.use(this.requestLogger.getLoggerMiddleware());
  }

  private registerPostRoutesMiddleware(): void {
    this.serverInstance.use(getErrorHandlerMiddleware((message) => this.logger.log('error', message)));
  }

  private createWatchDirectory(): void {
    try {
      if (!existsSync(this.realativeWatchDir)) {
        this.logger.log('info', `watch directory is not exists, creating in path: ${this.realativeWatchDir}.`);
        mkdirSync(this.realativeWatchDir);
      }
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.log('error', `error occured while creating watch directory: ${error}`);
      throw error;
    }
  }
}
