interface ILogMethod {
  (level: string, message: string, ...meta: unknown[]): void;
  (level: string, message: string): void;
}
export interface ILogger {
  log: ILogMethod;
}

export interface IConfig {
  get: <T>(setting: string) => T;
  has: (setting: string) => boolean;
}

export interface OpenApiConfig {
  filePath: string;
  basePath: string;
  jsonPath: string;
  uiPath: string;
}
