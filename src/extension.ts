import * as vscode from 'vscode';
import { Util } from './util';

export function activate(context: vscode.ExtensionContext) {

  const checkShebang = Util.serialExecution(async function (editor?: vscode.TextEditor) {

    if (!editor) {
      return;
    }

    const doc = editor.document;
    if (doc.languageId !== 'javascript') { // Only apply to JS files
      return; // Not javascript
    }

    const moduleName = Util.extractModule(doc.lineAt(0));
    if (!moduleName) { // Only if shebang is present
      return;
    }

    // Extract potential installation path
    const installed = Util.extractInstalledPath(doc.lineCount > 1 ? doc.lineAt(1) : '');

    if (installed) {
      console.log('[FOUND]', 'Previous installation detected');
      if (!await Util.isValidInstall(moduleName, installed)) {
        console.log('[NOT-FOUND]', `Previous install is pointing to a missing directory (${installed}`);
        await Util.updateLine(editor, '// NPX-TYPINGS', 1, 'replace'); // Clear out line
      } else {
        console.log('[FOUND]', `Previous install is pointing to a valid directory (${installed}`);
        return; // Success
      }
    } else {
      console.log('[NOT-FOUND]', 'Previous installation not detected');
      await Util.updateLine(editor, '// NPX-TYPINGS', 1, 'insert'); // Insert line
    }

    if (await Util.isLocal(moduleName)) {
      console.log('[FOUND]', `${moduleName} already available locally`);
      return;
    }

    try {
      const modPath = await Util.installDep(moduleName);
      console.log('[SUCCESS]', `${moduleName} successfully available at ${modPath}`);
      await Util.updateLine(editor, `/** @typedef {import('${modPath}')} */ // NPX-TYPINGS`, 1, 'replace');
    } catch (err) {
      console.log(err);
    }
  });

  // On edit
  vscode.window.onDidChangeVisibleTextEditors((editors) => editors.map(checkShebang), null, context.subscriptions);

  // On save
  vscode.workspace.onDidSaveTextDocument(doc =>
    vscode.window.visibleTextEditors.filter(x => x.document === doc)
      .map(checkShebang), null, context.subscriptions);

  // All on load
  setTimeout(() => {
    vscode.window.visibleTextEditors.map(checkShebang)
  }, 1000);
}

export function deactivate() {
  Util.cleanup();
}