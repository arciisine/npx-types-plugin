import { promises as fs } from 'fs';
import * as cp from 'child_process';
import * as util from 'util';

type ManualProm = Promise<any> & { resolve: (v: any) => void, reject: (err: Error) => void };

export class Util {

  /**
   * Verify path exists
   */
  static exists = (pth: string) => fs.stat(pth).then(x => true, x => false);

  static mkdir = (pth: string) => fs.mkdir(pth).then(x => pth, x => pth);

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
   * Log functionality
   */
  static log(area: string, message: string, ...args: any[]) {
    console.log(new Date().toISOString(), `[${area}]`, message, ...args);
  }

  /**
   * Remove folder
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
}
