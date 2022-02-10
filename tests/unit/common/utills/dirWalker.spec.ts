import { normalize } from 'path';
import { init as initFs } from '../../../mocks/fs/opendir';
import { fullFs } from '../../../mockData/fs';
import { DirWalker } from '../../../../src/common/utilities/dirWalker';
import { filesManagerMock } from '../../../mocks/filesManager';

let dirWalker: DirWalker;

describe('dirWalker', () => {
  beforeEach(() => {
    dirWalker = new DirWalker(filesManagerMock);
  });

  describe('walk', () => {
    it('find all files without options', async () => {
      initFs(fullFs);

      const gen = dirWalker.walk('');
      const res = await asyncGenToArray(gen);

      const expectedFiles = [
        normalize('layerSources/testDir/Shapes/Files.shp'),
        normalize('layerSources/testDir/Shapes/Files.dbf'),
        normalize('layerSources/testDir/Shapes/Product.shp'),
        normalize('layerSources/testDir/Shapes/Product.dbf'),
        normalize('layerSources/testDir/Shapes/ShapeMetadata.shp'),
        normalize('layerSources/testDir/Shapes/ShapeMetadata.dbf'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1881_Y1730.tfw'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1881_Y1730.tif'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1881_Y1731.tif'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1881_Y1732.tif'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1882_Y1730.tif'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1882_Y1731.tif'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1882_Y1732.tif'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1883_Y1730.tif'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1883_Y1731.tif'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1883_Y1732.tif'),
      ];
      expect(res).toEqual(expectedFiles);
    });

    it('find all files with regex', async () => {
      initFs(fullFs);

      const gen = dirWalker.walk('', {
        filePathMatcher: /.*\.dbf/,
      });
      const res = await asyncGenToArray(gen);

      const expectedFiles = [
        normalize('layerSources/testDir/Shapes/Files.dbf'),
        normalize('layerSources/testDir/Shapes/Product.dbf'),
        normalize('layerSources/testDir/Shapes/ShapeMetadata.dbf'),
      ];
      expect(res).toEqual(expectedFiles);
    });

    it('find all files with max results', async () => {
      initFs(fullFs);

      const gen = dirWalker.walk('', { maxResults: 2 });
      const res = await asyncGenToArray(gen);

      const expectedFiles = [normalize('layerSources/testDir/Shapes/Files.shp'), normalize('layerSources/testDir/Shapes/Files.dbf')];
      expect(res).toEqual(expectedFiles);
    });

    it('find all files with min depth', async () => {
      initFs(fullFs);

      const gen = dirWalker.walk('', { minDepth: 4 });
      const res = await asyncGenToArray(gen);

      const expectedFiles = [
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1881_Y1730.tfw'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1881_Y1730.tif'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1881_Y1731.tif'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1881_Y1732.tif'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1882_Y1730.tif'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1882_Y1731.tif'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1882_Y1732.tif'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1883_Y1730.tif'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1883_Y1731.tif'),
        normalize('layerSources/testDir/a/pyramid0_1/layer/X1883_Y1732.tif'),
      ];
      expect(res).toEqual(expectedFiles);
    });

    it('find all files with max depth', async () => {
      initFs(fullFs);

      const gen = dirWalker.walk('', { maxDepth: 4 });
      const res = await asyncGenToArray(gen);

      const expectedFiles = [
        normalize('layerSources/testDir/Shapes/Files.shp'),
        normalize('layerSources/testDir/Shapes/Files.dbf'),
        normalize('layerSources/testDir/Shapes/Product.shp'),
        normalize('layerSources/testDir/Shapes/Product.dbf'),
        normalize('layerSources/testDir/Shapes/ShapeMetadata.shp'),
        normalize('layerSources/testDir/Shapes/ShapeMetadata.dbf'),
      ];
      expect(res).toEqual(expectedFiles);
    });
  });
});

const asyncGenToArray = async <T>(gen: AsyncGenerator<T>): Promise<T[]> => {
  const arr: T[] = [];
  for await (const value of gen) {
    arr.push(value);
  }
  return arr;
};
