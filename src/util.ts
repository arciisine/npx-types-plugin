import * as vscode from 'vscode';
import { promises as fs } from 'fs';
import * as cp from 'child_process';
import * as util from 'util';
import * as os from 'os';
import * as path from 'path';

export class Util {

  static temp = fs.mkdtemp(path.join(os.tmpdir(), 'npx-typings-'));
  static exec = util.promisify(cp.exec);
  static running: Promise<any> | undefined = undefined;

  /**
   * Prevents concurrent execution of a passed in function
   */
  static serialExecution(fn: (...args: any[]) => Promise<any>) {
    return (...args: any[]) => {
      if (Util.running) {
        return Util.running;
      }
      const now = fn(...args).finally(() => delete Util.running);
      Util.running = now;
      return now;
    };
  }

  /**
   * Convert module name/path to a proper file location (with the proper name)
   */
  static requireToMod(moduleName: string, pth: string = moduleName) {
    const fullPath = require.resolve(pth); // Get location
    const folder = `${fullPath.substring(0, fullPath.lastIndexOf('/node_modules'))}/node_modules/${moduleName}`;
    return folder;
  }

  /**
   * Return match by group number from regex
   */
  static extractMatch(regex: RegExp, group: number = 1, line: string | vscode.TextLine = '') {
    const text = typeof line === 'string' ? line : line.text;
    let out = undefined;
    text.replace(regex, (all, ...rest) => {
      return out = rest[group - 1];
    });
    return out;
  }

  /**
   * Match on module name in shebang
   */
  static extractModule = Util.extractMatch.bind(null, /^#!.*npx\s+(\S+)/, 1);

  /**
   * Read path from npx loaded typings
   */
  static extractInstalledPath = Util.extractMatch.bind(null, /^.*@typedef.*import[(]['"]([^'"]+).*\/\/ NPX-TYPINGS$/, 1);

  /**
   * Determines if module is installed locally
   */
  static async isLocal(moduleName: string) {
    try {
      const found = Util.requireToMod(moduleName);
      console.log('[LOAD]', `${moduleName} is already installed at ${found}`);
      await fs.stat(found); // Ensure still installed
      return found;
    } catch  { }
  }

  /**
   * Install dependency
   */
  static async installDep(moduleName: string) {

    const cwd = await Util.temp;
    const cmd = `npm i --no-save ${moduleName}`;

    console.log('[INSTALL]', cmd);

    await Util.exec(cmd, { cwd });
    return `${cwd}/node_modules/${moduleName}`;
  }


  /**
   * Validate installation at path, for specific module
   */
  static async isValidInstall(moduleName: string, installedAt: string) {
    try {
      await fs.stat(installedAt); // Exists
      console.log('[FOUND]', `Previous install ${installedAt} exists`);
      const folder = Util.requireToMod(moduleName, installedAt);
      if (moduleName === require(`${folder}/package.json`).name) { // Check name
        console.log('[FOUND]', `Previous install ${installedAt} points to proper module`);
        return true;
      }
    } catch { }

    return false;
  }

  /**
   * Update line in an editor
   */
  static async updateLine(editor: vscode.TextEditor, text: string, line: number, mode: 'insert' | 'replace') {
    while (editor.document.lineCount < line + 1) {
      await editor.edit(e => e.insert(new vscode.Position(editor.document.lineCount, 0), '\n'));
    }

    const now = editor.document.lineAt(line);
    const pos = new vscode.Position(line, 0);

    if (mode === 'replace') {
      await editor.edit(e => e.replace(new vscode.Range(pos, new vscode.Position(line, now.text.length)), ''));
    } else {
      await editor.edit(e => e.insert(pos, '\n'));
    }

    return await editor.edit((edit) => {
      edit[mode](pos, text);
    });
  }

  /**
   * Cleanup folder
   */
  static async cleanup() {
    const pth = await Util.temp;
    if (!pth || pth === '/') {
      console.error('Path has not been defined');
      return;
    }
    const cmd = process.platform === 'win32' ?
      `rmdir /Q /S ${pth}` :
      `rm -rf ${pth}`;

    await Util.exec(cmd);
  }
}