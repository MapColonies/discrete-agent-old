import { Trigger } from '../../src/layerCreator/models/trigger';

const triggerFunctionMock = jest.fn();
const triggerMock = {
  trigger: triggerFunctionMock,
} as unknown as Trigger;

export { triggerFunctionMock, triggerMock };
