import { join, normalize, sep } from 'path';
import { singleton } from 'tsyringe';

interface IFileMapping {
  fileExtension: string;
  pathPrefix: string;
}

type FileMappings = Record<string, IFileMapping | undefined>;

@singleton()
export class FileMapper {
  private readonly fileMappings: FileMappings = {
    shp: {
      fileExtension: 'shp',
      pathPrefix: 'Shapes',
    },
    dbf: {
      fileExtension: 'dbf',
      pathPrefix: 'Shapes',
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Tiff: {
      fileExtension: 'tif',
      pathPrefix: 'tiff',
    },
  };
  private stripSubDirsRegex!: RegExp;

  public constructor() {
    this.generateStripSubDirsRegex();
  }

  public stripSubDirs(directory: string): string {
    return directory.replace(this.stripSubDirsRegex, '');
  }

  public getFilePath(fileName: string, fileFormat: string): string {
    const mapping = this.fileMappings[fileFormat];
    if (mapping !== undefined) {
      return join(mapping.pathPrefix, `${fileName}.${mapping.fileExtension}`);
    } else {
      return `${fileName}.${fileFormat}`;
    }
  }

  private generateStripSubDirsRegex(): void {
    const subPaths = Object.values(this.fileMappings).map((mapping) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const path = normalize(mapping!.pathPrefix);
      return path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //escape for regex
    });
    const pattern = `(^|\\${sep})(${subPaths.join('|')})$`;
    this.stripSubDirsRegex = new RegExp(pattern);
  }
}
