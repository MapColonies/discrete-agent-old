import { FsItem } from './fsItem';

export function getFsItem(fsRoot: FsItem, path: string): FsItem | undefined {
  const keys = process.platform === 'win32' ? path.split('\\') : path.split('/');
  let item = fsRoot;
  let i = 0;
  if (keys[0] === '' || (process.platform === 'win32' && keys[0].endsWith(':'))) {
    i++;
  }
  const end = keys[keys.length - 1] === '' ? keys.length - 1 : keys.length;
  for (; i < end; i++) {
    item = (item.content as Record<string, FsItem>)[keys[i]];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (item === undefined) {
      break;
    }
  }
  return item;
}
