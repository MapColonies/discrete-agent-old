import { FsItem } from './fsItem';

export function getFsItem(fsRoot: FsItem, path: string): FsItem | undefined {
  const keys = process.platform === 'win32' ? path.split('\\') : path.split('/');
  let item = fsRoot;
  for (const key of keys) {
    item = (item.content as Record<string, FsItem>)[key];
    console.log(key, item);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (item === undefined) {
      break;
    }
  }
  return item;
}
