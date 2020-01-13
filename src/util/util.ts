import { promises as fs } from 'fs';
import * as cp from 'child_process';
import * as util from 'util';

type ManualProm = Promise<any> & { resolve: (v: any) => void, reject: (err: Error) => void };

const exec = util.promisify(cp.exec);

export class Util {

  static logging = true;

  /**
   * Verify path exists
   */
  static exists = (pth: string) => fs.stat(pth).then(x => true, x => false);

  static mkdir = (pth: string) => fs.mkdir(pth).then(x => pth, x => pth);

  static sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  static async exec(cmd: string, opts?: cp.ExecOptions) {
    Util.log('UTIL', 'Executing', cmd);
    const res = await exec(cmd, opts);
    // if (res.stderr.length) {
    //   throw new Error(typeof res.stderr === 'string' ? res.stderr : res.stderr.toString('utf8'));
    // }
    return typeof res.stdout === 'string' ? res.stdout : res.stdout.toString('utf8');
  }

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
    if (Util.logging) {
      console.debug(new Date().toISOString(), `[${area}]`, message, ...args);
    }
  }

  /**
   * Remove folder
   */
  static rmdir(pth: string) {
    if (!pth || pth === '/') {
      console.error('Path has not been defined');
      return;
    }
    const cmd = process.platform === 'win32' ?
      `rmdir /Q /S ${pth}` :
      `rm -rf ${pth}`;

    return this.exec(cmd);
  }
}
