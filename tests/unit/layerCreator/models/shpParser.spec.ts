/* eslint-disable jest/no-mocks-import */
import { GeoJSON } from 'geojson';
import { Proj, defs } from 'proj4'
import { ShpParser } from '../../../../src/layerCreator/models/shpParser';
import { readFile as readFileMock } from '../../../__mocks__/fs/promises';
import { read as readShpMock } from '../../../__mocks__/shapefile';

let shpParser: ShpParser;

const epsg32736GeoJson: GeoJSON = {
  type: 'Point',
  coordinates: [672567.53, 3556211.63],
};
const wgs84GeoJson: GeoJSON = {
  type: 'Point',
  coordinates: [32.129105, 34.829407],
};
const epsg32736Prj =
  'PROJCS["WGS_1984_UTM_Zone_36S",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",33],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",10000000],UNIT["Meter",1]]';

describe('ShpParser', () => {
  beforeEach(function () {
    shpParser = new ShpParser({ log: jest.fn() });
    readFileMock.mockClear();
    readShpMock.mockClear();
  });

  describe('parse', () => {
    it('should return the parsed file when no projection is defined', async function () {
      readShpMock.mockResolvedValue(epsg32736GeoJson);

      // action
      const geoJson = await shpParser.parse('test', 'teat');

      // expectation
      expect(geoJson).toEqual(epsg32736GeoJson);
    });

    it('should return the parsed file as wgs84 when projection is defined', async function () {
      console.log(typeof epsg32736GeoJson.coordinates);
      readShpMock.mockResolvedValue(epsg32736GeoJson);
      readFileMock.mockResolvedValue(epsg32736Prj);
      // action
      const geoJson = await shpParser.parse('test', 'teat', 'test');

      // expectation
      expect(geoJson).toEqual(wgs84GeoJson);
    });

    it.only('proj4',()=>{
        defs("EPSG:32736","+proj=utm +zone=36 +south +datum=WGS84 +units=m +no_defs");
        defs("EPSG:32636","+proj=utm +zone=36 +datum=WGS84 +units=m +no_defs");
        defs("EPSG:23036","+proj=utm +zone=36 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs");
        const wgs84prj='GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]'
        const res1 =Proj("EPSG:32636").inverse([672567.53, 3556211.63]);
        const res2 =Proj("EPSG:32636").inverse({x:672567.53, y:3556211.63});
        expect(res2).toEqual([32.129105, 34.829407]);
        expect(res1).toEqual([32.129105, 34.829407]);
        // const res1 =Proj(wgs84prj).inverse([32.129105, 34.829407]);
        // const res2 =Proj(wgs84prj).inverse({x:32.129105, y:34.829407});
        // expect(res1).toEqual([32.129105, 34.829407]);
        // expect(res2).toEqual([32.129105, 34.829407]);
    })
  });
});
