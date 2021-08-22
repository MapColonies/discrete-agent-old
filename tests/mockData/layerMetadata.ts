/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-magic-numbers */
export const metadata = {
  resolution: 0.0000018519,
  accuracyCE90: 1,
  sensorType: ['OTHER'],
  rms: undefined,
  scale: undefined,
  producerName: undefined,
  region: undefined,
  classification: '4',
  creationDate: undefined,
  ingestionDate: undefined,
  srsId: undefined,
  srsName: undefined,
  description: 'description',
  footprint: {
    type: 'Polygon',
    coordinates: [
      [
        [34.8851821360093, 32.0425133190045],
        [34.8444933529867, 32.0425133190045],
        [34.8444933529867, 32.0786811260038],
        [34.8851821360093, 32.0786811260038],
        [34.8851821360093, 32.0425133190045],
      ],
    ],
  },
  productVersion: '1.0',
  productId: 'LAYER',
  productName: 'product',
  productType: 'Orthophoto',
  updateDate: '2019-04-06T00:00:00.000Z',
  sourceDateEnd: '2019-04-06T00:00:00.000Z',
  sourceDateStart: '2019-04-06T00:00:00.000Z',
  type: 'RECORD_RASTER',
  layerPolygonParts: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          Dsc: 'description',
          Source: 'LAYER-1.0',
          SourceName: 'product',
          UpdateDate: '06/04/2019',
          Resolution: '0.2',
          Ep90: '1',
          Rms: null,
          SensorType: 'OTHER',
          Scale: null,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [34.8851821360093, 32.0425133190045],
              [34.8444933529867, 32.0425133190045],
              [34.8444933529867, 32.0786811260038],
              [34.8851821360093, 32.0786811260038],
              [34.8851821360093, 32.0425133190045],
            ],
          ],
        },
      },
    ],
    bbox: [34.8444933529867, 32.0425133190045, 34.8851821360093, 32.0786811260038],
  },
};
