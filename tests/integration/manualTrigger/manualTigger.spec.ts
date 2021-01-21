import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { registerTestValues } from '../testContainerConfig';
import * as requestSender from './helpers/requestSender';

describe('manualTrigger', function () {
  beforeAll(function () {
    registerTestValues();
    requestSender.init();
  });
  afterEach(function () {
    container.clearInstances();
  });

  describe('Happy Path', function () {
    it('should return 200 status code', async function () {
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.OK);
    });
  });

  describe('Bad Path', function () {
    // All requests with status code of 400
    it('should return 400 status code', async function () {
      const invalidRequest = {
        directory: 'testDir',
      };

      const response = await requestSender.createLayer(invalidRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });
  });

  describe('Sad Path', function () {
    // All requests with status code 4XX-5XX
  });
});
