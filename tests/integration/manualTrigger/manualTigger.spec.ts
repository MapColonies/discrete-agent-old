import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import axiosMock from 'jest-mock-axios';
import { registerTestValues } from '../testContainerConfig';
import { validateLayerFilesExistsMock, validateShpFilesExistsMock } from '../../mocks/filesManager';
import { initShapeFileMock } from '../../mocks/shapeFile';
import * as requestSender from './helpers/requestSender';

describe('manualTrigger', function () {
  beforeAll(function () {
    container.clearInstances();
    registerTestValues();
    requestSender.init();
  });
  beforeEach(() => {
    initShapeFileMock();
  });
  afterEach(function () {
    jest.resetAllMocks();
    axiosMock.reset();
  });

  describe('Happy Path', function () {
    it('should return 200 status code', async function () {
      validateLayerFilesExistsMock.mockResolvedValue(true);
      validateShpFilesExistsMock.mockResolvedValue(true);
      axiosMock.post.mockResolvedValue({});
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

    it('should return 400 when tiff files are missing', async () => {
      validateLayerFilesExistsMock.mockResolvedValue(false);
      validateShpFilesExistsMock.mockResolvedValue(true);
      axiosMock.post.mockResolvedValue({});
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 when shp files are missing', async () => {
      validateLayerFilesExistsMock.mockResolvedValue(true);
      validateShpFilesExistsMock.mockResolvedValue(false);
      axiosMock.post.mockResolvedValue({});
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });
  });

  describe('Sad Path', function () {
    // All requests with status code 4XX-5XX
  });
});
