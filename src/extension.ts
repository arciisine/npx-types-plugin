import * as vscode from 'vscode';
import { Util } from './util';

export function activate(context: vscode.ExtensionContext) {
  vscode.workspace.onDidOpenTextDocument(async x => {
    if (x.languageId !== 'javascript') {
      return; // Not javascript
    }

    const moduleName = Util.extractModule(x.lineAt(0));
    if (!moduleName) {
      return; // No shebang
    }

    const updateLine = Util.updateLine.bind(Util, vscode.window.activeTextEditor!);
    const installed = Util.extractInstalledPath(x.lineAt(1));

    if (installed) {
      if (!await Util.isValidInstall(moduleName, installed)) {
        await updateLine('#GENERATED', 1, 'replace'); // Clear out line
      } else {
        return; // Success
      }
    } else {
      await updateLine('#GENERATED', 1, 'insert'); // Insert line
    }

    const modPath = await Util.installDep(moduleName);

    await updateLine(`/** @typedef {import('${modPath}')} */ #GENERATED`, 1, 'replace');
  }, null, context.subscriptions);
}

export function deactivate() {

}