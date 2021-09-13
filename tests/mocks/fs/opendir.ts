import { FsItem } from './fsItem';
import { getFsItem } from './fsUtils';

const opendirMock = jest.fn();

let fs: FsItem;

// eslint-disable-next-line @typescript-eslint/ban-types
function init(rawFs: object): void {
  fs = FsItem.generateFsFromObject(rawFs);
  opendirMock.mockImplementation(async (path) => {
    console.log('path: ', path);
    console.log(fs);
    const item = getFsItem(fs, path);
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (item !== undefined && item.isDirectory()) {
      console.log('here');
      const entries = Object.values(item.content as Record<string, FsItem>);
      return Promise.resolve(entries);
    }
    return Promise.resolve([]);
  });
}

export { opendirMock, init };
