import { FsItem } from './fsItem';

export function getFsItem(fsRoot: FsItem, path: string): FsItem | undefined {
  const keys = path.split('/');
  let item = fsRoot;
  console.log(item);
  console.log(keys);
  for (const key of keys) {
    item = (item.content as Record<string, FsItem>)[key];
    console.log(item);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (item === undefined) {
      break;
    }
  }
  return item;
}
