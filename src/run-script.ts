import * as vscode from 'vscode';
import * as cp from 'child_process';

import { ID } from './types';
import { EditorUtil } from './editor';
import { ModuleUtil } from './module';

export class RunScriptUtil {

  static proc: cp.ChildProcess;
  static channel: vscode.OutputChannel;

  /**
   * Prepare output
   */
  static prepareOutput(editor: vscode.TextEditor) {
    const mod = EditorUtil.extractModuleFromShebang(editor)!;

    if (!this.channel) {
      this.channel = vscode.window.createOutputChannel(ID);
    }

    this.channel.clear();

    const file = editor.document.fileName;
    const relativeFile = file.replace(vscode.workspace.workspaceFolders![0].uri.fsPath, '.');

    [
      `[${new Date().toISOString().split('.')[0]}] Running ${relativeFile} via ${mod.full}`,
      '',
      'Output',
      '-'.repeat(30)
    ].map(l => this.channel.appendLine(l));

    this.channel.show(true);
  }

  /**
   * Launch process
   */
  static async launchProcess(editor: vscode.TextEditor) {
    const file = editor.document.fileName;
    const shebang = EditorUtil.extractShebang(editor)!;
    const typedefLoc = EditorUtil.extractTypedefImportPath(editor);
    const cmd = await ModuleUtil.getShebangCommand(shebang, typedefLoc);

    const [exe, ...args] = `${cmd} ${file}`.split(' ');
    this.proc = cp.spawn(exe, args, {
      stdio: 'pipe',
      cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? process.cwd()
    });

    // Close
    this.proc.on('close', (code) => {
      this.channel.appendLine(`\n[DONE] (exit code ${code})`);
    });

    // Running
    this.proc.stdout!.on('data', (chunk: string | Buffer) => {
      if (typeof chunk === 'string') {
        this.channel.append(chunk);
      } else {
        this.channel.append(chunk.toString('utf8'));
      }
    });

    // Running
    this.proc.stderr!.on('data', (chunk: string | Buffer) => {
      if (typeof chunk === 'string') {
        this.channel.append(chunk);
      } else {
        this.channel.append(chunk.toString('utf8'));
      }
    });
  }

  /**
   * Run script for given editor, if applicable
   */
  static async run(editor: vscode.TextEditor) {
    const mod = EditorUtil.extractModuleFromShebang(editor);
    if (!mod) return;

    if (this.proc) {
      this.proc.kill('SIGKILL');
      delete this.proc;
    }

    await this.prepareOutput(editor);
    await this.launchProcess(editor);
  }
}