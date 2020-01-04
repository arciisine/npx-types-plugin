import * as vscode from 'vscode';
import { Util } from './util';

export class NpxEditor {

  private static cache = new Set<string>();

  /**
   * Verify editor is valid
   */
  static verifyEditor(editor?: vscode.TextEditor): editor is vscode.TextEditor {
    if (!editor) {
      return false;
    }

    if (editor.document.languageId !== 'javascript') { // Only apply to JS files
      return false; // Not javascript
    }

    if (!Util.extractModule(editor)) { // If missing shebang skip
      return false;
    }

    return true;
  }

  /**
   * Verify existing types
   */
  static async verifyExistingTypings(editor: vscode.TextEditor) {

    const moduleName = Util.extractModule(editor)!;
    const installed = Util.extractInstalledPath(editor);

    if (installed) {
      if (NpxEditor.cache.has(`${moduleName}||${installed}`)) {
        console.log('[FOUND]', `Previous install is cached (${installed})`);
        return true; // Already seen
      }

      if (await Util.isValidInstall(moduleName, installed)) {
        console.log('[FOUND]', `Previous install is pointing to a valid directory (${installed})`);
        return true; // Success
      }
    }

    console.log('[NOT-FOUND]', `Previous install is`, installed ? `pointing to a missing directory (${installed})` : 'not detected');
    await Util.updateTypingsLine(editor, `/* ${Util.lineId} */ // Installing`, installed ? 'replace' : 'insert'); // Clear out line
  }


  /**
   * Install module, and set typings
   */
  static async installModule(editor: vscode.TextEditor) {
    const moduleName = Util.extractModule(editor)!;

    if (await Util.isLocal(moduleName)) {
      console.log('[FOUND]', `${moduleName} already available locally`);
      return;
    }

    try {
      const installed = await Util.installDep(moduleName);
      console.log('[SUCCESS]', `${moduleName} successfully available at ${installed}`);
      await Util.updateTypingsLine(editor, `/* ${Util.lineId} */ /** @typedef {import('${installed}')} */ // @ts-check`, 'replace');
      NpxEditor.cache.add(`${moduleName}||${installed}`);
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Process an editor, install typings if needed
   */
  static async processEditor(editor?: vscode.TextEditor) {

    if (!NpxEditor.verifyEditor(editor)) {
      return;
    }

    if (await NpxEditor.verifyExistingTypings(editor)) {
      return;
    }

    await NpxEditor.installModule(editor);
  }
}