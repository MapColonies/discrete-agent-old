import { OverseerClient } from '../../../src/serviceClients/overseerClient';

const ingestDiscreteLayerMock = jest.fn();

const overseerClientMock = {
  ingestDiscreteLayer: ingestDiscreteLayerMock,
} as unknown as OverseerClient;

export { overseerClientMock, ingestDiscreteLayerMock };
