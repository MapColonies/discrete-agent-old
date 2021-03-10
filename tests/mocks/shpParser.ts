import { ShpParser } from '../../src/layerCreator/models/shpParser';

const parseMock = jest.fn();
const toGeoJsonMock = jest.fn();

const ShpParserMock = ({
    parse: parseMock,
    toGeoJson: toGeoJsonMock
} as unknown) as ShpParser;

export { ShpParserMock, parseMock, toGeoJsonMock };
