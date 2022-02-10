import { promises as fsPromise, constants as fsConstants, readFileSync } from 'fs';
import * as path from 'path';
import { singleton, inject } from 'tsyringe';
import S3 from 'aws-sdk/clients/s3';
import { IConfig } from '../../common/interfaces';
import { Services } from '../../common/constants';

interface IS3Config {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucket: string;
  forcePathStyle: boolean;
  sslEnabled: boolean;
}
@singleton()
export class FilesManager {
  public constructor(@inject(Services.CONFIG) private readonly config: IConfig) {}

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

  public async readS3ObjectAsString(key: string): Promise<string> {
    const s3Config = this.config.get<IS3Config>('S3');
    const s3 = new S3({
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
      endpoint: s3Config.endpoint,
      s3ForcePathStyle: s3Config.forcePathStyle,
      sslEnabled: s3Config.sslEnabled,
    });
    if (process.platform === 'win32') {
      key = key.replace(/\\/g, '/');
    }
    const options: S3.GetObjectRequest = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Bucket: s3Config.bucket,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Key: key,
    };
    return s3
      .getObject(options)
      .promise()
      .then((obj) => obj.Body?.toString('utf-8') as string);
  }
}
