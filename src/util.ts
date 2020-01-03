import * as vscode from 'vscode';
import { promises as fs } from 'fs';
import * as cp from 'child_process';
import * as util from 'util';

export class Util {

  static temp = fs.mkdtemp('npx-shebang');
  static spawn = util.promisify(cp.spawn);

  static extractMatch(regex: RegExp, line: string | vscode.TextLine = '', group: number = 1) {
    const text = typeof line === 'string' ? line : line.text;
    const matches = text.match(regex) ?? [] as (string[] | { groups: Record<string, string> }); // If shebang
    return 'groups' in matches ? matches.groups[group] : undefined;
  }

  static extractModule = Util.extractMatch.bind(null, /^#.*npx\s+(S+)/);
  static extractInstalledPath = Util.extractMatch.bind(null, /^.*@typedef.*import[(]['"]([^'"]+).*#GEN$/);

  static async installDep(moduleName: string) {
    const cwd = await this.temp;
    await this.spawn('npm', ['i', '--no-save', moduleName], {
      cwd,
      shell: true
    });
    return `${cwd}/node_modules/${moduleName}`;
  }

  static async isValidInstall(moduleName: string, installedAt: string) {
    try {
      // Check existence
      await fs.stat(installedAt);
    } catch {
      return false;
    }

    const fullPath = require.resolve(installedAt);
    if (!fullPath) {
      return false;
    }

    if (moduleName !== require(`${fullPath}/package.json`).name) {
      return false;
    }

    return true;
  }

  static updateLine(editor: vscode.TextEditor, text: string, line: number, mode: 'insert' | 'replace') {
    return editor.edit((edit) => {
      edit[mode](new vscode.Position(line, 0), text);
    });
  }


}