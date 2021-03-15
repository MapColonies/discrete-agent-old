import { DBClient } from '../../../src/serviceClients/dbClient';

const getWatchStatusMock = jest.fn();
const setWatchStatusMock = jest.fn();

const dbClientMock = ({
  getWatchStatus: getWatchStatusMock,
  setWatchStatus: setWatchStatusMock,
} as unknown) as DBClient;

const init = (): void => {
  getWatchStatusMock.mockResolvedValue({ isWatching: false });
};
export { dbClientMock, getWatchStatusMock, setWatchStatusMock, init };
