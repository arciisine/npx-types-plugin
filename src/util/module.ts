import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Mod, ID, PackageJson } from '../types';
import { Util } from './util';

const log = Util.log.bind(null, 'MODULE');

const getPackageJson: (name: string) => PackageJson =
  require('get-package-json-from-registry');


export class ModuleUtil {

  static cacheDir = Util.mkdir(path.join(os.tmpdir(), ID));

  /**
   * Get package.json, typed
   */
  static async getPackage(pth: string) {
    try {
      return JSON.parse(await fs.readFile(`${pth}/package.json`, 'utf8')) as PackageJson;
    } catch {
      return;
    }
  }

  /**
   * Verify that the found module matches the appropriate info
   */
  static async verifyInfo(mod: Mod, pth: string) {
    try {
      const pkg = (await this.getPackage(pth))!;
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

    const errOut = new Error(msg);
    (errOut as any).installError = true;
    return errOut;
  }

  /**
   * Uninstall module
   */
  static async uninstall(mod: Mod) {
    const target = path.join(await this.cacheDir, mod.safe);

    // If target is already there
    if (await Util.exists(target)) {
      // Only works on extension managed install
      if (target.startsWith(await this.cacheDir)) {
        log('Removing module folder', target);
        await Util.rmdir(target); // Clear out on force
      }
    } else {
      log('Module not found', mod.name);
    }
  }

  /**
   * Install dependency
   */
  static async install(mod: Mod) {
    // If on node path
    const local = await this.validateInstallation(mod);
    if (local) {
      return local;
    };

    // If manually installed
    const target = path.join(await this.cacheDir, mod.safe);
    if (await this.validateInstallation(mod, target)) {
      return target; // Return if valid and found
    } else {
      await this.uninstall(mod); // Cleanup if folder isn't valid
    }

    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'z-'));

    // Now install
    try {
      const cmd = `npm i --no-save ${mod.full}`;
      log('Installing', cmd);
      await Util.exec(cmd, { cwd });
      await fs.rename(`${cwd}/node_modules/${mod.name}`, target);
      await fs.rename(`${cwd}/node_modules`, `${target}/node_modules`);
      log(`${mod.full} successfully available at ${target}`);
    } catch (err) {
      log(`${mod.full} failed to install`, err);
      throw this.cleanInstallError(mod, err);
    } finally {
      // Cleanup temp dir
      await Util.rmdir(cwd);
    }

    return target;
  }

  static async findRoot(loc: string) {
    while (loc && loc !== '/') {
      loc = path.dirname(loc);
      if (this.getPackage(loc)) {
        return loc;
      }
    }
  }

  /**
   * Validate installation at path, for specific module
   */
  static async validateInstallation(mod: Mod, installedAt?: string) {
    try {
      const fullPath = require.resolve(installedAt ?? mod.name); // Get location
      const root = await this.findRoot(fullPath);

      if (
        root &&
        await this.verifyInfo(mod, root)
      ) {
        log(`Valid installation found at ${root}`);
        return root;
      }
    } catch { }
  }

  /**
   * Extracts shebang command to run, opting for local install for speed reasons
   */
  static async getShebangCommand(shebang: string, typedefLoc?: string) {
    if (typedefLoc) {
      const pkg = await this.getPackage(typedefLoc);
      if (pkg) {
        const [bin] = [...Object.values(pkg.bin ?? {})];
        if (bin) {
          return path.resolve(typedefLoc, bin);
        }
      }
    }
    return shebang.replace(/^#!/, ''); // Strip prefix
  }

  /**
   * See if module has types
   */
  static async verifyModuleHasTypes(mod: Mod) {
    try {
      const res = await getPackageJson(mod.full);
      return !!res.types || res.files?.find(x => x.endsWith('.d.ts'));
    } catch {
      return false;
    }
  }
}