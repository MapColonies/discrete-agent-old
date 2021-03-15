import { AgentDbClient } from '../../../src/serviceClients/agentDbClient';

const updateDiscreteStatusMock = jest.fn();
const getWatchStatusMock = jest.fn();
const setWatchStatusMock = jest.fn();

const agentDbClientMock = ({
  updateDiscreteStatus: updateDiscreteStatusMock,
  getWatchStatus: getWatchStatusMock,
  setWatchStatus: setWatchStatusMock,
} as unknown) as AgentDbClient;

const init = (): void => {
  getWatchStatusMock.mockResolvedValue({ isWatching: false });
};

export { agentDbClientMock, updateDiscreteStatusMock, getWatchStatusMock, setWatchStatusMock, init };
