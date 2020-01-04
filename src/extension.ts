import * as vscode from 'vscode';

import { Util } from './util';
import { NpxEditor } from './editor';

export function activate(context: vscode.ExtensionContext) {
  const processEditor = Util.serialExecution(NpxEditor.processEditor);

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
}

export function deactivate() {
  Util.cleanup();
}