import { FsItem } from './fsItem';
import { getFsItem } from './fsUtils';

const opendirMock = jest.fn();

let fs: FsItem;

// eslint-disable-next-line @typescript-eslint/ban-types
function init(rawFs: object): void {
  fs = FsItem.generateFsFromObject(rawFs);
  opendirMock.mockImplementation((path) => {
    const item = getFsItem(fs, path);
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (item !== undefined && item.isDirectory()) {
      const entries = Object.values(item.content as Record<string, FsItem>);
      return entries;
    }
    return [];
  });
}

export { opendirMock, init };
