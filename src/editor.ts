import * as vscode from 'vscode';
import { ModuleUtil } from './module';
import { Mod, ID } from './types';
import { TextUtil } from './text';
import { Util } from './util';

export class EditorUtil {

  static TYPEDEF_SIMPLE = new RegExp(ID);
  static TYPEDEF_EXTRACT = new RegExp(`^/[*] ${ID} [*]/.*@typedef.*import[(]['"]([^'"]+)`);
  static SHEBANG_EXTRACT = /^#!.*npx\s+((?:@|\w)\w*(?:[/]\w+)?(?:@\S+)?)/;

  /**
   * Get the whole shebang
   */
  static extractShebang(editor: vscode.TextEditor) {
    return TextUtil.findLine(editor, /#!/)?.text;
  }

  /**
   * Read path from npx loaded typings
   */
  static extractTypedefImportPath(editor: vscode.TextEditor) {
    return TextUtil.extractMatch(editor, this.TYPEDEF_EXTRACT, 1);
  }

  /**
 * Match on module name in shebang
 */
  static extractModuleFromShebang(editor: vscode.TextEditor): Mod | undefined {
    const match = TextUtil.extractMatch(editor, this.SHEBANG_EXTRACT, 1);
    return match ? new Mod(match) : undefined;
  }

  static updateLine(editor: vscode.TextEditor, line: string) {
    return TextUtil.updateLine(editor, line, this.TYPEDEF_SIMPLE, 1);
  }

  /**
   * Verify existing types
   */
  static async hasValidTypedef(editor: vscode.TextEditor, mod: Mod) {
    const installed = this.extractTypedefImportPath(editor);
    const valid = await ModuleUtil.validateInstallation(mod, installed);

    if (installed && !!valid) {
      console.log('[FOUND]', `Previous install is pointing to a valid directory (${installed})`);
      return true; // Success
    }

    console.log('[NOT-FOUND]', `Previous install is`, installed ? `pointing to a missing directory (${installed})` : 'not detected');
    await this.updateLine(editor, `/* ${ID} */ // Installing`); // Clear out line
  }

  /**
   * Ensure typedef is in file
   */
  static async ensureTypedef(editor: vscode.TextEditor, loc: string) {
    const installed = this.extractTypedefImportPath(editor);

    if (!installed) {
      await this.updateLine(editor, `/* ${ID} */ /** @typedef {import('${loc}')} */ // @ts-check`);
    }
  }

  /**
   * Install module, and set typings
   */
  static async installModule(editor: vscode.TextEditor, mod: Mod) {
    try {
      const installed = await ModuleUtil.install(mod);
      await this.ensureTypedef(editor, installed);
      console.log('[SUCCESS]', `${mod.full} successfully available at ${installed}`);
    } catch (err) {
      console.log('[ERROR]', err);
      await this.updateLine(editor, `/* ${ID} */ // Installation failed: ${err.message}`);
    }
  }

  /**
   * Process an editor, install typings if needed
   */
  static async processEditor(editor: vscode.TextEditor, mod: Mod) {
    const prev = ModuleUtil.getInstalledPath(mod);
    if (prev) {
      console.log('[FOUND]', `Previous install is cached ${prev}`);
      await this.ensureTypedef(editor, prev);
      return
    }
    if (!await this.hasValidTypedef(editor, mod)) {
      await this.installModule(editor, mod);
    }
  }

  /**
   * Remove typedef
   */
  static async removeTypedef(doc: vscode.TextDocument) {
    await Util.removeContent(doc.fileName, new RegExp(`/[*] ${ID} [*]/[^\n]*\n`, 'sg'));
  }
}