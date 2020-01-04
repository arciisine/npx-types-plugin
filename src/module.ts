import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';

import { ID, Mod } from './types';
import { Util } from './util';

export class ModuleUtil {

  static temp = fs.mkdtemp(path.join(os.tmpdir(), `${ID.substring(1)}-`));
  static running: Promise<any> | undefined = undefined;
  private static installCache = new Map<string, string>();

  static hasSeen(mod: Mod) {
    return this.installCache.has(mod.full);
  }

  static getInstalledPath(mod: Mod) {
    return this.installCache.get(mod.full)!;
  }

  /**
   * Convert module name/path to a proper file location (with the proper name)
   */
  static async resolveLocation(mod: Mod, pth: string = mod.name): Promise<string | undefined> {
    try {
      const fullPath = require.resolve(pth); // Get location
      const folder = `${fullPath.substring(0, fullPath.lastIndexOf('/node_modules'))}/node_modules/${mod.name}`;
      if (await Util.exists(folder)) {
        return folder;
      }
    } catch { }
  }


  /**
   * Verify that the found module matches the appropriate info
   */
  static async verifyInfo(mod: Mod, pth: string) {
    try {
      const pkg = require(`${pth}/package.json`);
      return mod.name === pkg.name && (!mod.version || mod.version === pkg.version);
    } catch {
      return false;
    }
  }

  /**
   * Cleans installation error
   */
  static cleanInstallError(mod: Mod, err: Error) {
    let msg: string = err.message;
    const lines = msg.split('\n');
    msg = lines
      .filter(x => x.includes(mod.full))
      .map(l => l.replace(/(npm ERR! notarget)|(Command Failed)/, '').trim())
      .slice(-1)[0];

    if (!msg) {
      msg = lines[0];
    }

    return new Error(msg);
  }

  /**
   * Install dependency
   */
  static async install(mod: Mod) {
    const cwd = path.join(await this.temp, mod.full.replace(/[@/]/g, '_'));
    const local = await this.validateInstallation(mod);
    const target = local ?? `${cwd}/node_modules/${mod.name}`;

    if (!local) {
      await fs.mkdir(cwd).catch(() => { });
    }

    this.installCache.set(mod.full, target);

    if (!await Util.exists(target)) {
      // Not there, now install
      const cmd = `npm i --no-save ${mod.full}`;
      console.log('[INSTALL]', cmd);
      try {
        await Util.exec(cmd, { cwd });
      } catch (err) {
        console.log('[FAILED]', err);
        throw this.cleanInstallError(mod, err);
      }
    }

    return target;
  }

  /**
   * Validate installation at path, for specific module
   */
  static async validateInstallation(mod: Mod, installedAt?: string) {
    const loc = await this.resolveLocation(mod, installedAt);

    if (loc && await this.verifyInfo(mod, loc)) {
      console.log('[FOUND]', `Previous valid install ${installedAt} exists`);
      return loc;
    }

    return;
  }

  /**
   * Extracts shebang command to run, opting for local install for speed reasons
   */
  static async getShebangCommand(shebang: string, typedefLoc?: string) {
    if (typedefLoc) {
      const pkgJson = `${typedefLoc}/package.json`;

      if (await Util.exists(pkgJson)) {
        const [bin] = [...Object.values(require(pkgJson).bin ?? {})] as string[];
        if (bin) {
          return path.resolve(typedefLoc, bin);
        }
      }
    }
    return shebang.split(/#!/)[1]; // Strip prefix
  }


  /**
   * Cleanup folder
   */
  static async cleanup() {
    return Util.rmdir(await this.temp);
  }
}