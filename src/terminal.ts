import * as vscode from 'vscode';

import { ID } from './types';
import { EditorUtil } from './editor';
import { ModuleUtil } from './module';

export class TerminalUtil {

  static get currentTerminal(): vscode.Terminal | undefined {
    return vscode.window.terminals.find(x => x.name === ID);
  }

  static async kill() {
    const term = this.currentTerminal;
    if (term) {
      term.show(false);
      await vscode.commands.executeCommand('workbench.action.terminal.kill');
    }
  }

  /**
   * Create new terminal
   */
  static create() {
    vscode.window.createTerminal(ID);
    if (process.platform !== 'win32') {
      this.sendLine(`export PS1=''`);
      this.sendLine('stty -echo');
      this.sendLine('clear');
    }
  }

  static sendLine(msg: string = '') {
    this.currentTerminal?.sendText(`${msg}\n`);
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


    const file = editor.document.fileName;

    await this.kill();
    this.create();

    const relativeFile = file.replace(vscode.workspace.workspaceFolders![0].uri.fsPath, '.');

    this.sendLine(`echo "[${new Date().toISOString()}] Running ${mod.full} with ${relativeFile}"`)
    this.sendLine(`echo`);
    this.sendLine(`echo "Output"`);
    this.sendLine(`echo "${'-'.repeat(30)}"`);
    this.sendLine(`${cmd} ${file}`);

    this.currentTerminal?.show(true);
  }
}