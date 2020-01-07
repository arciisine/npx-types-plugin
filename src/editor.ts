import * as vscode from 'vscode';
import { ModuleUtil } from './module';
import { Mod, ID, ID_SAFE } from './types';
import { TextUtil } from './text';

export class EditorUtil {

  static TAG_LINE = new RegExp(`^/[*][*][ ]*${ID}`);
  static TAG_LINE_EXTRACT = new RegExp(`^/[*][*][ ]*${ID}[ ]*-[ ]*([^:]+)[ ]*[*]/`);
  static TYPEDEF_SIMPLE = new RegExp(`@typedef.+import.*${ID_SAFE}`);
  static TYPEDEF_EXTRACT = new RegExp(`^/[*][*][ ]*@typedef.*import[(]['"]([^'"]+)['"][ ]*${ID_SAFE}`);
  static SHEBANG_EXTRACT = /^#!.*npx\s+((?:@|\w)\w*(?:[/]\w+)?(?:@\S+)?)/;

  private static installCache = new Map<string, string | Error>();

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
   * Read path from npx loaded typings
   */
  static extractInstallState(editor: vscode.TextEditor) {
    return TextUtil.extractMatch(editor, this.TAG_LINE_EXTRACT, 1);
  }

  /**
   * Match on module name in shebang
   */
  static extractModuleFromShebang(editor: vscode.TextEditor): Mod | undefined {
    const match = TextUtil.extractMatch(editor, this.SHEBANG_EXTRACT, 1);
    return match ? new Mod(match) : undefined;
  }

  static updateTagLine(editor: vscode.TextEditor, line: string, after?: string) {
    return TextUtil.updateLine(editor, `/** ${ID} - ${line} */${after ?? ''}`, this.TAG_LINE, 1);
  }

  static updateTypedefLine(editor: vscode.TextEditor, loc?: string) {
    const [, id] = editor.document.fileName.split(vscode.workspace.workspaceFolders![0].uri.fsPath);
    const cleanId = id.replace(/([.]js$)|[\/-@]+/g, '_');
    return TextUtil.updateLine(editor, loc && `/** @typedef {import('${loc}')} ${ID_SAFE}_${cleanId} */`, this.TYPEDEF_SIMPLE, 2);
  }

  /**
   * Ensure typedef is in file and is valid
   */
  static async ensureTypedef(editor: vscode.TextEditor, mod: Mod, loc: string | Error | undefined) {
    if (!loc) {
      return;
    }
    if (typeof loc === 'string') {
      if (!await ModuleUtil.validateInstallation(mod, loc)) {
        return false;
      }
      this.installCache.set(mod.full, loc);
      await this.updateTagLine(editor, `found`, ' // @ts-check');
      await this.updateTypedefLine(editor, loc);
      return true;
    } else {
      this.installCache.set(mod.full, loc);
      await this.updateTagLine(editor, `not found: ${loc.message}`);
      await this.updateTypedefLine(editor, undefined)
    }
  }

  /**
   * Remove typedef
   */
  static async removeTypedef(doc: vscode.TextDocument) {
    if (this.SHEBANG_EXTRACT.test(doc.lineAt(0).text)) { // only with shebangs
      await TextUtil.removeContent(doc, this.TAG_LINE);
      await TextUtil.removeContent(doc, this.TYPEDEF_SIMPLE);
    }
  }

  /**
   * Install module
   */
  static async installModule(editor: vscode.TextEditor, mod: Mod, force = false) {
    try {
      // Now installing
      await this.updateTagLine(editor, `installing ...`);
      await this.updateTypedefLine(editor, undefined);

      const installed = await ModuleUtil.install(mod, force);
      await this.ensureTypedef(editor, mod, installed);
      console.log('[SUCCESS]', `${mod.full} successfully available at ${installed}`);
    } catch (err) {
      await this.ensureTypedef(editor, mod, err);
      console.log('[ERROR]', err);
    }
  }

  /**
   * Re-download module
   */
  static async reinstallModule(editor: vscode.TextEditor) {
    const mod = this.extractModuleFromShebang(editor)!;
    await this.installModule(editor, mod, true);
  }

  /**
   * Process an editor, install typings if needed
   */
  static async processEditor(editor: vscode.TextEditor) {
    const mod = this.extractModuleFromShebang(editor);
    if (!mod) {
      return;
    }

    const typedefPath = this.extractTypedefImportPath(editor);
    const cachedTypedefPath = this.installCache.get(mod.full)!;

    if (typedefPath && typedefPath === cachedTypedefPath) {
      return; // If unchanged, return
    }

    // Use cached value if good 
    if (await this.ensureTypedef(editor, mod, cachedTypedefPath)) {
      console.log('[FOUND]', `Previous install is cached ${cachedTypedefPath}`);
      return;
    }
    // Honor path if valid install
    if (await this.ensureTypedef(editor, mod, typedefPath)) {
      console.log('[FOUND]', `Previous install found ${typedefPath}`);
      return;
    }

    console.log('[NOT-FOUND]', `Previous install is`,
      typedefPath ? `pointing to a missing directory (${typedefPath})` : 'not detected');

    await this.installModule(editor, mod);
  }
}