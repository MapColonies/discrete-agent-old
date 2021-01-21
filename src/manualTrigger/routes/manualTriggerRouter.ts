import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { ManualTriggerController } from '../controllers/manualTriggerController';

const manualTriggerRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ManualTriggerController);

  router.post('/', controller.createLayer);

  return router;
};

export { manualTriggerRouterFactory };
