import { inject, singleton } from 'tsyringe';
import { polygon, intersect, Feature, Polygon, area } from '@turf/turf';
import { Services } from '../../common/constants';
import { IConfig } from '../../common/interfaces';
import { FilesManager } from './filesManager';

interface IResolutionRule {
  name: string;
  value: number;
  minResolution: number;
  minDataInclusionRate: number;
}

interface IClassificationOption {
  polygonCoordinates: number[][][];
  resolutionRules: IResolutionRule[];
  defaultValue: number;
}

@singleton()
export class Classifier {
  private readonly resolutionRules: IResolutionRule[];
  private readonly classificationPolygon: Feature<Polygon>;
  private readonly defaultClassification: number;

  public constructor(@inject(Services.CONFIG) config: IConfig, fileManager: FilesManager) {
    const classificationOptionsPath = config.get<string>('classificationOptionsFile');
    const rawOptions = fileManager.readAsStringSync(classificationOptionsPath);
    const parsedOptions = JSON.parse(rawOptions) as IClassificationOption;
    this.resolutionRules = parsedOptions.resolutionRules.sort((rule1, rule2) => rule1.value - rule2.value);
    this.classificationPolygon = polygon(parsedOptions.polygonCoordinates);
    this.defaultClassification = parsedOptions.defaultValue;
  }

  public getClassification(resolution: number, polygonCoordinates: number[][][]): number {
    const polygonFeature = polygon(polygonCoordinates);
    const intersection = intersect(this.classificationPolygon, polygonFeature);
    const intersectionArea = intersection != null ? area(intersection) : 0;
    const intersectionRate = intersectionArea / area(polygonFeature);
    for (let i = 0; i < this.resolutionRules.length; i++) {
      const rule = this.resolutionRules[i];
      if (intersectionRate >= rule.minDataInclusionRate && resolution < rule.minResolution) {
        return rule.value;
      }
    }
    return this.defaultClassification;
  }
}
