import { AgentDbClient } from '../../../src/serviceClients/agentDbClient';

const updateDiscreteStatusMock = jest.fn();

const agentDbClientMock = ({
  updateDiscreteStatus: updateDiscreteStatusMock,
} as unknown) as AgentDbClient;

export { agentDbClientMock, updateDiscreteStatusMock };
