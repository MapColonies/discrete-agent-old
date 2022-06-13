/* eslint-disable @typescript-eslint/naming-convention */
import { cloneDeep } from 'lodash';

const fullFs = {
  layerSources: {
    testDir: {
      Shapes: {
        'Files.shp': 'file',
        'Files.dbf': 'file',
        'Product.shp': 'file',
        'Product.dbf': 'file',
        'ShapeMetadata.shp': 'file',
        'ShapeMetadata.dbf': 'file',
      },
      a: {
        pyramid0_1: {
          layer: {
            'X1881_Y1730.tfw': 'file',
            'X1881_Y1730.tif': 'file',
            'X1881_Y1731.tif': 'file',
            'X1881_Y1732.tif': 'file',
            'X1882_Y1730.tif': 'file',
            'X1882_Y1731.tif': 'file',
            'X1882_Y1732.tif': 'file',
            'X1883_Y1730.tif': 'file',
            'X1883_Y1731.tif': 'file',
            'X1883_Y1732.tif': 'file',
          },
        },
      },
    },
  },
};

const withoutTfw = cloneDeep(fullFs);

let file = withoutTfw.layerSources.testDir.a.pyramid0_1.layer as Record<string, unknown>;
delete file['X1881_Y1730.tfw'];

const withoutProductDbf = cloneDeep(fullFs);
file = withoutProductDbf.layerSources.testDir.Shapes as Record<string, unknown>;
delete file['Product.dbf'];

const withoutTiff = cloneDeep(fullFs);
file = withoutTiff.layerSources.testDir.a.pyramid0_1.layer as Record<string, unknown>;
delete file['X1881_Y1732.tif'];

export { fullFs, withoutTfw, withoutProductDbf, withoutTiff };
