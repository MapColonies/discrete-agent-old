import { promises as fsPromise, constants as fsConstants } from 'fs';
import * as path from 'path';
import { singleton } from 'tsyringe';

@singleton()
export class FilesManager {
  public async validateShpFilesExists(
    filesShp: string,
    filesDbf: string,
    productShp: string,
    productDbf: string,
    metadataShp: string,
    metadataDbf: string
  ): Promise<boolean> {
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

  private async fileExists(path: string): Promise<boolean> {
    return fsPromise
      .access(path, fsConstants.F_OK)
      .then(() => true)
      .catch((err) => {
        return false;
      });
  }
}
