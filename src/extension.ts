import * as vscode from 'vscode';

import { ModuleUtil } from './module';
import { EditorUtil } from './editor';
import { Util } from './util';
import { TerminalUtil } from './terminal';


export function activate(context: vscode.ExtensionContext) {
  const processEditor = Util.debounce(EditorUtil.processEditor.bind(EditorUtil), 500);

  // On edit
  vscode.window.onDidChangeVisibleTextEditors(all =>
    all.map(processEditor),
    null, context.subscriptions);

  // On save
  vscode.workspace.onDidSaveTextDocument(doc =>
    vscode.window.visibleTextEditors
      .filter(x => x.document === doc)
      .map(processEditor),
    null, context.subscriptions);

  // All on load
  setTimeout(() => vscode.window.visibleTextEditors.map(processEditor), 1000);

  // Register run command
  vscode.commands.registerCommand('npx-types.run', () => {
    if (vscode.window.activeTextEditor) {
      TerminalUtil.runScript(vscode.window.activeTextEditor);
    }
  });
}

export function deactivate() {
  ModuleUtil.cleanup();
}