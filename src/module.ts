import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';

import { ID, Mod } from './types';
import { Util } from './util';

export class ModuleUtil {

  static cacheDir = Util.mkdir(path.join(os.tmpdir(), `${ID.substring(1)}`));

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
    const local = await this.validateInstallation(mod);
    const target = local ?? path.join(await this.cacheDir, mod.safe);;

    if (!await Util.exists(target)) {
      const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'z-'));

      // Not there, now install
      const cmd = `npm i --no-save ${mod.full}`;
      console.log('[INSTALL]', cmd);
      try {
        await Util.exec(cmd, { cwd });
        await fs.rename(`${cwd}/node_modules/${mod.name}`, target);
        await fs.rename(`${cwd}/node_modules`, `${target}/node_modules`);
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
    try {
      const key: 'name' | 'safe' = installedAt && installedAt.includes('node_modules') ? 'name' : 'safe';
      const fullPath = require.resolve(installedAt ?? mod.name); // Get location
      const folder = `${fullPath.split(mod[key])[0]}${mod[key]}`;

      if (
        fullPath.includes(mod[key]) &&
        await Util.exists(folder) &&
        await this.verifyInfo(mod, folder)
      ) {
        console.log('[FOUND]', `Previous valid install ${installedAt} exists`);
        return folder;
      }
    } catch { }
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
}