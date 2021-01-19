import { readFile } from 'fs/promises';
import { read as readShp } from 'shapefile';
import { Proj } from 'proj4';
import { BBox, Feature, FeatureCollection, GeoJSON, GeoJsonObject, Geometry, GeometryCollection, Point } from 'geojson';
import { inject } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';

declare type Transform = (coordinates: number[]) => number[];
declare type GeneralCords = number[] | number[][] | number[][][] | number[][][][];
interface BasicGeometry extends GeoJsonObject {
  coordinates: GeneralCords;
}

export class ShpParser {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger) {}

  public async parse(shp: string, dbf: string, prj?: string, encoding = 'utf-8'): Promise<GeoJSON> {
    const geoJson = await this.toGeoJson(shp, dbf, encoding);
    //TODO: delete
    const t = geoJson as Point;
    console.log(typeof t.coordinates);
    if (prj !== undefined && prj != '') {
      await this.reProject(geoJson, prj);
    }
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

  private async reProject(geoJson: GeoJSON, prj: string): Promise<void> {
    //TODO: delete console
    console.log('!!!!!!!!!!!!!!!!!!!reprojectiong!!!!!!!!!!!!!');
    try {
      const projectionString = await readFile(prj, { encoding: 'utf-8' });
      const projection = Proj(projectionString);
      const transform = projection.inverse.bind(projection);
      switch (geoJson.type) {
        case 'FeatureCollection':
          this.reProjectFeatureCollection(geoJson, transform);
          break;
        case 'Feature':
          this.reProjectFeature(geoJson, transform);
          break;
        default:
          this.reProjectGeometry(geoJson, transform);
          break;
      }
    } catch (err) {
      const error = err as Error;
      this.logger.log('error', `failed to reproject shapeFile: ${error.message}`);
      //TODO: add custom error
      throw err;
    }
  }

  private reProjectFeatureCollection(geoJson: FeatureCollection, transform: Transform): void {
    if (geoJson.bbox) {
      geoJson.bbox = this.parseBBox(geoJson.bbox, transform);
    }
    geoJson.features.forEach((feat) => {
      this.reProjectFeature(feat, transform);
    });
  }

  private reProjectFeature(geoJson: Feature, transform: Transform): void {
    if (geoJson.bbox) {
      geoJson.bbox = this.parseBBox(geoJson.bbox, transform);
    }
    this.reProjectGeometry(geoJson.geometry, transform);
  }

  private reProjectGeometry(geoJson: Geometry, transform: Transform): void {
    switch (geoJson.type) {
      case 'GeometryCollection':
        this.reProjectGeometryCollection(geoJson, transform);
        break;
      default:
        this.reProjectBasicGeometry(geoJson, transform);
        break;
    }
  }

  private reProjectGeometryCollection(geoJson: GeometryCollection, transform: Transform): void {
    if (geoJson.bbox) {
      geoJson.bbox = this.parseBBox(geoJson.bbox, transform);
    }
    geoJson.geometries.forEach((geometry) => {
      this.reProjectGeometry(geometry, transform);
    });
  }

  private reProjectBasicGeometry(geoJson: BasicGeometry, transform: Transform): void {
    if (geoJson.bbox) {
      geoJson.bbox = this.parseBBox(geoJson.bbox, transform);
    }
    //TODO: delete console
    console.log('!!!!!!!!!!!!!!!!!!!reprojectiong basic !!!!!!!!!!!!!');
    console.log(typeof geoJson.coordinates);
    geoJson.coordinates = this.parseCoordinates(geoJson.coordinates, transform);
  }

  private parseCoordinates<T extends GeneralCords>(coordinates: T, transform: Transform): T {
    if (coordinates.length > 0) {
      if (Array.isArray(coordinates[0])) {
        const cords = coordinates as GeneralCords[];
        for (let i = 0; i < coordinates.length; i++) {
          cords[i] = this.parseCoordinates(coordinates[i] as GeneralCords, transform);
        }
        return cords as T;
      } else {
        //TODO: delete console
        console.log('!!!!!!!!!!!!!!!!!!!reprojectiong internal!!!!!!!!!!!!!');
        console.log(coordinates);
        console.log(typeof coordinates);
        let coordinatesArray: number[] = [];
        if (typeof coordinates === 'object') {
          (coordinates as number[]).forEach((value: number) => {
            coordinatesArray.push(value);
          });
        } else {
          coordinatesArray = coordinates as number[];
        }
        console.log(typeof coordinatesArray);
        const wgs84Cords = transform(coordinatesArray) as T;
        console.log(wgs84Cords);
        return wgs84Cords;
      }
    }
    return coordinates;
  }

  private parseBBox(bbox: BBox, transform: Transform): BBox {
    const bbox3DLength = 6;
    if (bbox.length === bbox3DLength) {
      const point1 = transform([bbox[0], bbox[1], bbox[2]]);
      const point2 = transform([bbox[3], bbox[4], bbox[5]]);
      return [point1[0], point1[1], point1[2], point2[0], point2[1], point2[2]];
    } else {
      const point1 = transform([bbox[0], bbox[1]]);
      const point2 = transform([bbox[2], bbox[3]]);
      return [point1[0], point1[1], point2[0], point2[1]];
    }
  }
}
