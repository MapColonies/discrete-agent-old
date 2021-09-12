import { promises as fsPromise, constants as fsConstants, readFileSync } from 'fs';
import * as path from 'path';
import { singleton } from 'tsyringe';

@singleton()
export class FilesManager {
  public async validateShpFilesExists(
    filesShp: string | undefined,
    filesDbf: string | undefined,
    productShp: string | undefined,
    productDbf: string | undefined,
    metadataShp: string | undefined,
    metadataDbf: string | undefined
  ): Promise<boolean> {
    if (
      filesShp === undefined ||
      filesDbf === undefined ||
      productShp === undefined ||
      productDbf === undefined ||
      metadataShp === undefined ||
      metadataDbf === undefined
    ) {
      return false;
    }
    const filesExist = await Promise.all([
      this.fileExists(filesShp),
      this.fileExists(filesDbf),
      this.fileExists(productShp),
      this.fileExists(productDbf),
      this.fileExists(metadataShp),
      this.fileExists(metadataDbf),
    ]);
    for (const fileExist of filesExist) {
      if (!fileExist) {
        return false;
      }
    }
    return true;
  }

  public async validateLayerFilesExists(directory: string, files: string[]): Promise<boolean> {
    for (let i = 0; i < files.length; i++) {
      if (!path.isAbsolute(files[i])) {
        files[i] = path.join(directory, files[i]);
      }
      if (!(await this.fileExists(files[i]))) {
        return false;
      }
    }
    return true;
  }

  public async fileExists(path: string): Promise<boolean> {
    return fsPromise
      .access(path, fsConstants.F_OK)
      .then(() => true)
      .catch(() => {
        return false;
      });
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
