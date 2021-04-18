import AsyncLock from 'async-lock';
import { isArray } from 'lodash';
import { singleton } from 'tsyringe';

export type AsyncLockDoneCallback<T> = (err?: Error, ret?: T) => void;

/// this class will lock code and will cancel previous pending tasks when new task is added
@singleton()
export class LimitingLock {
  private readonly lock: AsyncLock;
  private readonly tasksQueues: Record<string, string[] | undefined>;
  public constructor() {
    this.lock = new AsyncLock();

    //allow access to internal queues property
    // eslint-disable-next-line
    this.tasksQueues = (this.lock as any).queues;
  }

  public async acquire<T>(key: string | string[], fn: (() => T | PromiseLike<T>) | ((done: AsyncLockDoneCallback<T>) => unknown)): Promise<T> {
    const keys = isArray(key) ? key : [key];
    for (let i = 0; i < keys.length; i++) {
      if (this.tasksQueues[keys[i]] != undefined) {
        this.tasksQueues[keys[i]] = [];
      }
    }
    return this.lock.acquire<T>(key, fn);
  }

  public isQueueEmpty(key: string): boolean {
    return this.tasksQueues[key] === undefined || this.tasksQueues[key]?.length === 0;
  }
}
