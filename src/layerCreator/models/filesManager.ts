import { promises as fsPromise, constants as fsConstants, readFileSync, Stats, lstatSync } from 'fs';
import { singleton } from 'tsyringe';

@singleton()
export class FilesManager {
  //required for testing as fs promises cant be mocked here
  public openDir = fsPromise.opendir;

  public async fileExists(path: string): Promise<boolean> {
    return fsPromise
      .access(path, fsConstants.F_OK)
      .then(() => true)
      .catch(() => {
        return false;
      });
  }

  public directoryExists(fullPath: string): boolean {
    try {
      const stats: Stats = lstatSync(fullPath);
      return stats.isDirectory();
    } catch (e) {
      return false;
    }
  }

  public async readAllLines(path: string): Promise<string[]> {
    const content = await this.readAsString(path);
    return content.split(/\r?\n/);
  }

  public async readAsString(path: string): Promise<string> {
    return fsPromise.readFile(path, { encoding: 'utf8' });
  }

  public readAsStringSync(path: string): string {
    return readFileSync(path, { encoding: 'utf8' });
  }
}
