import { Dir, OpenDirOptions } from 'fs';
import { join as joinPath } from 'path';
import { singleton } from 'tsyringe';
import { FilesManager } from '../../layerCreator/models/filesManager';

interface IDirWalkerOptions {
  maxDepth?: number;
  minDepth?: number;
  filePathMatcher?: RegExp;
  maxResults?: number;
}

interface IInternalOptions extends IDirWalkerOptions {
  yieldCount: number;
}

@singleton()
class DirWalker {
  //required for testing as fs promises cant be mocked here
  private readonly opendir: (path: string, options?: OpenDirOptions | undefined) => Promise<Dir>;

  public constructor(fileManager: FilesManager) {
    this.opendir = fileManager.openDir;
  }

  public walk(path: string, options?: IDirWalkerOptions): AsyncGenerator<string> {
    const internalOptions = {
      ...options,
      yieldCount: 0,
    };
    return this.walkDir(path, internalOptions, 0);
  }

  public async findFile(basePath: string, fileMatcher: RegExp): Promise<string | undefined> {
    const gen = this.walk(basePath, {
      filePathMatcher: fileMatcher,
      maxResults: 1,
    });
    const path = gen.next().then((item) => item.value as string | undefined);
    //call gen again to close dir;
    await gen.return(undefined);
    return path;
  }

  private async *walkDir(path: string, options: IInternalOptions, depth = 0): AsyncGenerator<string> {
    const dir = await this.opendir(path);
    //TODO: remove debug console
    // console.log('dir: ', dir);
    for await (const dirent of dir) {
      //TODO: remove debug console
      // console.log('dirEnt: ', dirent);
      if (options.maxResults != undefined && options.yieldCount >= options.maxResults) {
        //TODO: remove debug console
        // console.log('stopped 1');
        return;
      }
      const itemPath = joinPath(path, dirent.name);
      if (dirent.isDirectory()) {
        //TODO: remove debug console
        // console.log('directory');
        if (options.maxDepth === undefined || options.maxDepth > depth) {
          yield* this.walkDir(itemPath, options, depth + 1);
        }
      } else if (dirent.isFile()) {
        //TODO: remove debug console
        // console.log('file: ', itemPath);
        if (options.minDepth === undefined || options.minDepth <= depth) {
          if (options.filePathMatcher === undefined || options.filePathMatcher.test(itemPath)) {
            options.yieldCount++;
            yield itemPath;
          }
        }
      }
    }
  }
}

export { DirWalker, IDirWalkerOptions };
