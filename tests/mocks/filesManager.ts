import { FilesManager } from '../../src/layerCreator/models/filesManager';

const validateShpFilesExistsMock = jest.fn();
const validateLayerFilesExistsMock = jest.fn();
const filesManagerMock = ({
  validateShpFilesExists: validateShpFilesExistsMock,
  validateLayerFilesExists: validateLayerFilesExistsMock,
} as unknown) as FilesManager;
export { validateShpFilesExistsMock, validateLayerFilesExistsMock, filesManagerMock };
