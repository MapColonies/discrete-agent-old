import { read as readShp } from 'shapefile';
import { GeoJSON } from 'geojson';
import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';

@injectable()
export class ShpParser {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger) {}

  public async parse(shp: string, dbf: string, encoding = 'utf-8'): Promise<GeoJSON> {
    const geoJson = await this.toGeoJson(shp, dbf, encoding);
    return geoJson;
  }

  private async toGeoJson(shp: string, dbf: string, encoding = 'utf-8'): Promise<GeoJSON> {
    try {
      return await readShp(shp, dbf, { encoding: encoding });
    } catch (err) {
      const error = err as Error;
      this.logger.log('error', `failed to parse shapeFile: ${error.message}`);
      //TODO: add custom error
      throw err;
    }
  }
}
