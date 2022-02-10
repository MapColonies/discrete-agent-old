import { MetadataMapper } from '../../src/layerCreator/models/metadataMapper';

const parseFilesShpJsonMock = jest.fn();
const mapMock = jest.fn();
const metadataMapperMock = {
  parseFilesShpJson: parseFilesShpJsonMock,
  map: mapMock,
} as unknown as MetadataMapper;

export { parseFilesShpJsonMock, mapMock, metadataMapperMock };
