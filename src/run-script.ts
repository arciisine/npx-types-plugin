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
      this.channel = vscode.window.createOutputChannel(`@${ID}`);
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
   * Output line
   */
  static append(chunk: string | Buffer) {
    if (typeof chunk === 'string') {
      this.channel.append(chunk);
    } else {
      this.channel.append(chunk.toString('utf8'));
    }
  }

  /**
   * Mark as done
   */
  static appendDone(code?: number) {
    this.append(`\n[DONE] (exit code ${code})\n`);
  }

  static watchProc(op: 'on' | 'off') {
    if (this.proc) {
      this.proc[op]('close', this.appendDone);
      this.proc.stdout![op]('data', this.append);
      this.proc.stderr![op]('data', this.append);
    }
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

    this.watchProc('on');
  }

  /**
   * Run script for given editor, if applicable
   */
  static async run(editor: vscode.TextEditor) {
    const mod = EditorUtil.extractModuleFromShebang(editor);
    if (!mod) return;

    if (this.proc) {
      this.watchProc('off');
      this.proc.kill('SIGKILL')
    }

    await this.prepareOutput(editor);
    await this.launchProcess(editor);
  }
}

RunScriptUtil.append = RunScriptUtil.append.bind(RunScriptUtil);
RunScriptUtil.appendDone = RunScriptUtil.appendDone.bind(RunScriptUtil); 