import { ShpParser } from '../../src/layerCreator/models/shpParser';

const parseMock = jest.fn();
const toGeoJsonMock = jest.fn();

const shpParserMock = {
  parse: parseMock,
  toGeoJson: toGeoJsonMock,
} as unknown as ShpParser;

export { shpParserMock, parseMock, toGeoJsonMock };
