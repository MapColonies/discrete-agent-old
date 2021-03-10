import { OverseerClient } from '../../../src/serviceClients/overseerClient';

const ingestDiscreteLayerMock = jest.fn();

const OverseerClientMock = ({
  ingestDiscreteLayer: ingestDiscreteLayerMock
} as unknown) as OverseerClient;

export { OverseerClientMock, ingestDiscreteLayerMock };
