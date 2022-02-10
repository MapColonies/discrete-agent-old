import { resolve } from 'path';
import { readFileSync } from 'fs';
import { Classifier } from '../../../../src/layerCreator/models/classifier';
import { filesManagerMock, readAsStringMock, readS3ObjectAsStringMock } from '../../../mocks/filesManager';
import { configMock, setConfigValues } from '../../../mocks/config';

let classificationConfig: string;

describe('classifier', () => {
  let classifier: Classifier;

  beforeAll(() => {
    loadTestData();
  });

  beforeEach(() => {
    readAsStringMock.mockResolvedValue(classificationConfig);
    setConfigValues({
      classification: {
        optionsFileLocation: 'testPath',
        storageProvider: 'FS',
      },
    });
    classifier = new Classifier(configMock, filesManagerMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getClassification', () => {
    it('high res fully in bounds returns configured classification', async () => {
      const res = 0.008;
      const polygon = [
        [
          [0.01, 0.01],
          [0.01, 0.99],
          [0.99, 0.99],
          [0.99, 0.01],
          [0.01, 0.01],
        ],
      ];
      // action
      const classification = await classifier.getClassification(res, polygon);

      // expectation
      const expectedClassification = 1;
      expect(classification).toEqual(expectedClassification);
    });

    it('med res fully in bounds returns configured classification', async () => {
      const res = 0.04;
      const polygon = [
        [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
      ];
      // action
      const classification = await classifier.getClassification(res, polygon);

      // expectation
      const expectedClassification = 3;
      expect(classification).toEqual(expectedClassification);
    });

    it('med res fully out of bounds returns configured classification', async () => {
      const res = 0.04;
      const polygon = [
        [
          [2, 2],
          [2, 3],
          [3, 3],
          [3, 2],
          [2, 2],
        ],
      ];
      // action
      const classification = await classifier.getClassification(res, polygon);

      // expectation
      const expectedClassification = 4;
      expect(classification).toEqual(expectedClassification);
    });

    it('med res partial cover of inner area (more then configured) returns configured classification', async () => {
      const res = 0.04;
      const polygon = [
        [
          [-0.1, -0.1],
          [-0.1, 0.9],
          [1, 0.9],
          [1, -0.1],
          [-0.1, -0.1],
        ],
      ];
      // action
      const classification = await classifier.getClassification(res, polygon);

      // expectation
      const expectedClassification = 3;
      expect(classification).toEqual(expectedClassification);
    });

    it('med res partial covered (less then configured) returns configured classification', async () => {
      const res = 0.04;
      const polygon = [
        [
          [-0.1, -0.1],
          [-0.1, 0.1],
          [1, 0.1],
          [1, -0.1],
          [-0.1, -0.1],
        ],
      ];
      // action
      const classification = await classifier.getClassification(res, polygon);

      // expectation
      const expectedClassification = 4;
      expect(classification).toEqual(expectedClassification);
    });

    it('low res in bounds returns default classification', async () => {
      const res = 0.05;
      const polygon = [
        [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
      ];
      // action
      const classification = await classifier.getClassification(res, polygon);

      // expectation
      const expectedClassification = 5;
      expect(classification).toEqual(expectedClassification);
    });

    it('low res out of bounds returns default classification', async () => {
      const res = 1;
      const polygon = [
        [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
      ];
      // action
      const classification = await classifier.getClassification(res, polygon);

      // expectation
      const expectedClassification = 5;
      expect(classification).toEqual(expectedClassification);
    });

    it('request configuration file from s3 when configured to use s3', () => {
      readAsStringMock.mockClear();
      readS3ObjectAsStringMock.mockClear();
      readS3ObjectAsStringMock.mockResolvedValue(classificationConfig);
      setConfigValues({
        classification: {
          optionsFileLocation: 'testPath',
          storageProvider: 'S3',
        },
      });
      classifier = new Classifier(configMock, filesManagerMock);

      expect(readS3ObjectAsStringMock).toHaveBeenCalledTimes(1);
      expect(readAsStringMock).toHaveBeenCalledTimes(0);
    });

    it('request configuration file from fs when configured to use fs', () => {
      readAsStringMock.mockClear();
      readS3ObjectAsStringMock.mockClear();
      readS3ObjectAsStringMock.mockResolvedValue(classificationConfig);
      setConfigValues({
        classification: {
          optionsFileLocation: 'testPath',
          storageProvider: 'fs',
        },
      });
      classifier = new Classifier(configMock, filesManagerMock);

      expect(readS3ObjectAsStringMock).toHaveBeenCalledTimes(0);
      expect(readAsStringMock).toHaveBeenCalledTimes(1);
    });
  });
});

function loadTestData() {
  const classificationConfigPath = resolve(__dirname, '../../../mockData/classification.json');

  classificationConfig = readFileSync(classificationConfigPath, { encoding: 'utf8' });
}
