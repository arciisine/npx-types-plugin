import * as vscode from 'vscode';
import { ID } from './types';
import { EditorUtil } from './editor';
import { ModuleUtil } from './module';

export class TerminalUtil {

  /**
   * Clear terminal display
   */
  static async clear() {
    if (this.terminal) {
      this.terminal.sendText('clear');
    }
  }

  /**
   * Get terminal, or create if missing
   */
  static get terminal(): vscode.Terminal {
    let found = vscode.window.terminals.find(x => x.name === ID);
    if (!found) {
      found = vscode.window.createTerminal(ID);
      if (process.platform !== 'win32') {
        found.sendText(`stty -echo\n`);
        found.sendText(`export PS1=''\n`);
      }
    }
    return found;
  }

  /**
   * Run script for given editor, if applicable
   */
  static async runScript(editor: vscode.TextEditor) {
    const shebang = EditorUtil.extractShebang(editor);
    if (!shebang) return;

    const mod = EditorUtil.extractModuleFromShebang(editor);
    if (!mod) return;

    const typedefLoc = EditorUtil.extractTypedefImportPath(editor);
    const cmd = await ModuleUtil.getShebangCommand(shebang, typedefLoc);

    await this.clear();
    this.terminal.sendText(`${cmd} ${editor.document.fileName}\n`);
    this.terminal.show(true);
  }
}