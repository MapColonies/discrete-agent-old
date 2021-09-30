import { AgentDbClient } from '../../../src/serviceClients/agentDbClient';

const getDiscreteStatusMock = jest.fn();
const createDiscreteStatusMock = jest.fn();
const updateDiscreteStatusMock = jest.fn();
const getWatchStatusMock = jest.fn();
const setWatchStatusMock = jest.fn();

const agentDbClientMock = {
  getDiscreteStatus: getDiscreteStatusMock,
  createDiscreteStatus: createDiscreteStatusMock,
  updateDiscreteStatus: updateDiscreteStatusMock,
  getWatchStatus: getWatchStatusMock,
  setWatchStatus: setWatchStatusMock,
} as unknown as AgentDbClient;

const init = (): void => {
  getWatchStatusMock.mockResolvedValue({ isWatching: false });
};

export { agentDbClientMock, getDiscreteStatusMock, createDiscreteStatusMock, updateDiscreteStatusMock, getWatchStatusMock, setWatchStatusMock, init };
