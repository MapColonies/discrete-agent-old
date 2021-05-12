export class FsItem {
  public constructor(public name: string, public content: unknown) {}

  // eslint-disable-next-line @typescript-eslint/ban-types
  public static generateFsFromObject(fs: object): FsItem {
    const root = new FsItem('', FsItem.generateFsEntriesFromObject(fs));
    const wrapper = new FsItem('fs', { '': root });
    return wrapper;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  private static generateFsEntriesFromObject(fs: object): Record<string, FsItem> {
    const entries: Record<string, FsItem> = {};
    for (const [key, value] of Object.entries(fs)) {
      entries[key] = new FsItem(key, typeof value === 'object' ? FsItem.generateFsEntriesFromObject(value) : undefined);
    }
    return entries;
  }

  public isDirectory(): boolean {
    return typeof this.content === 'object';
  }

  public isFile(): boolean {
    return typeof this.content !== 'object';
  }
}
