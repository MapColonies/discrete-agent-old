import { MCLogger } from '@map-colonies/mc-logger';

const errorMock = jest.fn();
const warnMock = jest.fn();
const infoMock = jest.fn();
const debugMock = jest.fn();
const logMock = jest.fn();

const loggerMock = ({
  error: errorMock,
  warn: warnMock,
  info: infoMock,
  debug: debugMock,
  log: logMock,
} as unknown) as MCLogger;

export { loggerMock, errorMock, warnMock, infoMock, debugMock, logMock };
