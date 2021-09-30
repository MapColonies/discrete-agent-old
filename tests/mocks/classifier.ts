import { Classifier } from '../../src/layerCreator/models/classifier';

const getClassificationMock = jest.fn();

const classifierMock = {
  getClassification: getClassificationMock,
} as unknown as Classifier;

export { classifierMock, getClassificationMock };
