import { join, sep, relative, resolve } from 'path';
import { inject, singleton } from 'tsyringe';
import { Services } from '../../common/constants';
import { IConfig, ILogger } from '../../common/interfaces';
import { DirWalker } from '../../common/utilities/dirWalker';

interface IFileMapping {
  fileExtension: string;
}

type FileMappings = Record<string, IFileMapping | undefined>;

@singleton()
export class FileMapper {
  private readonly watchDir: string;
  private readonly mountDir: string;
  private readonly fileMappings: FileMappings = {
    shp: {
      fileExtension: 'shp',
    },
    dbf: {
      fileExtension: 'dbf',
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Tiff: {
      fileExtension: 'tif',
    },
    tfw: {
      fileExtension: 'tfw',
    },
  };
  private escapePathRegex!: RegExp;
  private readonly rootDirNestingLevel: number;

  public constructor(
    @inject(Services.CONFIG) config: IConfig,
    @inject(Services.LOGGER) private readonly logger: ILogger,
    private readonly dirWalker: DirWalker
  ) {
    this.generateRegexPatterns();
    this.mountDir = config.get('mountDir');
    this.watchDir = join(this.mountDir, config.get('watcher.watchDirectory'));
    this.rootDirNestingLevel = config.get('watcher.rootDirNestingLevel');
  }

  public getRootDir(file: string, isManual = false): string {
    const baseDir = isManual ? this.mountDir : this.watchDir;
    let relPath = relative(baseDir, file);
    if (relPath.startsWith('.')) {
      const pointAndSeparatorLength = 2;
      relPath = relPath.slice(pointAndSeparatorLength, undefined);
    }
    const relBaseDir = this.stripSubDirs(relPath);
    const rootDir = resolve(baseDir, relBaseDir);
    return rootDir;
  }

  public async getFileFullPath(fileName: string, fileFormat: string, currentPath: string, isManual = false): Promise<string | undefined> {
    const root = this.getRootDir(currentPath, isManual);
    const filePattern = `${sep}${this.getFilePath(fileName, fileFormat)}`;
    const sanitizedPattern = filePattern.replace(this.escapePathRegex, '\\$&');
    const matcher = new RegExp(`.*${sanitizedPattern}`);
    return this.dirWalker.findFile(root, matcher);
  }

  public async findFilesRelativePaths(files: string[], rootPath: string): Promise<string[]> {
    if (!rootPath.endsWith(sep)) {
      rootPath += sep;
    }
    const filePatterns = [];
    for (const file of files) {
      const filePattern = `${sep}${file}`;
      const sanitizedPattern = filePattern.replace(this.escapePathRegex, '\\$&');
      filePatterns.push(`(^.*${sanitizedPattern}$)`);
    }
    const pattern = filePatterns.join('|');
    const matcher = new RegExp(pattern);
    const filePathsGen = this.dirWalker.walk(rootPath, {
      filePathMatcher: matcher,
      maxResults: files.length,
    });
    const filePaths = [];
    for await (const path of filePathsGen) {
      filePaths.push(relative(rootPath, path));
    }
    return filePaths;
  }

  public getFilePath(fileName: string, fileFormat: string): string {
    const mapping = this.fileMappings[fileFormat];
    if (mapping !== undefined) {
      return join(`${fileName}.${mapping.fileExtension}`);
    } else {
      return `${fileName}.${fileFormat}`;
    }
  }

  private stripSubDirs(directory: string): string {
    const parts = directory.split(sep);
    const maxParts = parts[0] === '.' ? this.rootDirNestingLevel + 1 : this.rootDirNestingLevel;
    const rootParts: string[] = [];
    for (let i = 0; i < maxParts; i++) {
      rootParts.push(parts[i]);
    }
    return rootParts.join(sep);
  }

  private generateRegexPatterns(): void {
    this.escapePathRegex = /[.*+?^${}()|[\]\\]/g.compile();
  }
}
