import { promises as fs } from 'fs';
import * as cp from 'child_process';
import * as util from 'util';

type ManualProm = Promise<any> & { resolve: (v: any) => void, reject: (err: Error) => void };

export class Util {

  /**
   * Verify path exists
   */
  static exists = (pth: string) => fs.stat(pth).then(x => true, x => false);

  static exec = util.promisify(cp.exec);

  static manualProm(): ManualProm {
    let p = new Promise((resolve, reject) => {
      setImmediate(() => {
        (p as any).resolve = resolve;
        (p as any).reject = reject;
      })
    });
    return p as ManualProm;
  }

  /**
   * Cleanup folder
   */
  static async rmdir(pth: string) {
    if (!pth || pth === '/') {
      console.error('Path has not been defined');
      return;
    }
    const cmd = process.platform === 'win32' ?
      `rmdir /Q /S ${pth}` :
      `rm -rf ${pth}`;

    await this.exec(cmd);
  }

  /**
   * Executes only latest invocation, with a required 1 seconds (default) of quiet
   */
  static debounce(fn: (...args: any[]) => Promise<any>, delay = 1000) {
    let timer: NodeJS.Timeout;
    let prom: ManualProm | undefined;

    return async (...args: any[]) => {
      if (prom === undefined) {
        prom = this.manualProm();
      }

      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        fn(...args)
          .then(prom!.resolve, prom!.reject)
          .finally(prom = undefined);
      }, delay);

      return prom!;
    };
  }
}