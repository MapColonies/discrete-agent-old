import { normalize, join as joinPath } from 'path';
import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import axiosMock from 'jest-mock-axios';
import { registerTestValues } from '../testContainerConfig';
import { directoryExistsMock, fileExistsMock, readAllLinesMock } from '../../mocks/filesManager';
import { initShapeFileMock } from '../../mocks/shapeFile';
import { registerDefaultConfig } from '../../mocks/config';
import { init as initFs } from '../../mocks/fs/opendir';
import { tfw } from '../../mockData/tfw';
import { fullFs, withoutProductDbf, withoutTfw, withoutTiff } from '../../mockData/fs';
import * as requestSender from './helpers/requestSender';

describe('manualTrigger', function () {
  const layerRootDir = normalize('/layerSources/testDir');
  const expectedTfw = joinPath(layerRootDir, 'a', 'pyramid0_1', 'layer', 'X1881_Y1730.tfw');

  beforeAll(function () {
    container.clearInstances();
    registerTestValues();
    requestSender.init();
  });
  beforeEach(() => {
    initShapeFileMock();
    registerDefaultConfig();
    directoryExistsMock.mockReturnValue(true);
  });
  afterEach(function () {
    jest.resetAllMocks();
    axiosMock.reset();
  });

  describe('Happy Path', function () {
    it('should return 200 status code when triggered on layer root dir', async function () {
      initFs(fullFs);
      axiosMock.post.mockResolvedValue({});
      readAllLinesMock.mockResolvedValue(tfw);
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.OK);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const calledTfw = readAllLinesMock.mock.calls[0][0] as string;
      expect(calledTfw.endsWith(expectedTfw)).toBe(true);
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
      initFs(withoutTiff);
      axiosMock.post.mockResolvedValue({});
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 when shp files are missing', async () => {
      initFs(withoutProductDbf);
      axiosMock.post.mockResolvedValue({});
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 when first tfw file are missing', async () => {
      initFs(withoutTfw);
      axiosMock.post.mockResolvedValue({});
      fileExistsMock.mockResolvedValue(false);
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 status code when triggered on layer Shapes dir', async function () {
      initFs(fullFs);
      axiosMock.post.mockResolvedValue({});
      readAllLinesMock.mockResolvedValue(tfw);
      const validRequest = {
        sourceDirectory: 'testDir/Shapes',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 status code when triggered on layer tiff dir', async function () {
      initFs(fullFs);
      axiosMock.post.mockResolvedValue({});
      readAllLinesMock.mockResolvedValue(tfw);
      const validRequest = {
        sourceDirectory: 'testDir/tiff',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });
  });

  describe('Sad Path', function () {
    it('should return 404 status code when triggered on invalid dir path', async function () {
      initFs(fullFs);
      directoryExistsMock.mockReturnValue(false);
      axiosMock.post.mockResolvedValue({});
      readAllLinesMock.mockResolvedValue(tfw);
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
    });
  });
});
