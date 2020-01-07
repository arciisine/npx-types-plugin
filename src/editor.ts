import * as vscode from 'vscode';
import { ModuleUtil } from './module';
import { Mod, ID } from './types';
import { TextUtil } from './text';

export class EditorUtil {

  static TAG_LINE = TextUtil.templateRe(/^\/{3}_@ts-check # $ID - ([^:\n]+)(_:_.*)?_$/, ID);
  static TYPEDEF = TextUtil.templateRe(/^\/{3}_<reference types_=_"([^"\n]+)"_\/> # $ID$/, ID);
  static SHEBANG = TextUtil.templateRe(/^#!\/.*?(?:\/| )npx ((?:@\w+\/)?\w+(?:@\S+)?)_.*$/, '');

  private static installCache = new Map<string, string | Error>();

  /**
   * Get the whole shebang
   */
  static extractShebang(docOrEd: vscode.TextEditor | vscode.TextDocument) {
    return TextUtil.findLine(docOrEd, /#!/)?.text;
  }

  /**
   * Read path from npx loaded typings
   */
  static extractTypedefImportPath(docOrEd: vscode.TextEditor | vscode.TextDocument) {
    return TextUtil.extractMatch(docOrEd, this.TYPEDEF, 1);
  }

  /**
   * Read path from npx loaded typings
   */
  static extractInstallState(docOrEd: vscode.TextEditor | vscode.TextDocument) {
    return TextUtil.extractMatch(docOrEd, this.TAG_LINE, 1);
  }

  /**
   * Match on module name in shebang
   */
  static extractModuleFromShebang(docOrEd: vscode.TextEditor | vscode.TextDocument): Mod | undefined {
    const match = TextUtil.extractMatch(docOrEd, this.SHEBANG, 1);
    return match ? new Mod(match) : undefined;
  }

  static updateTagLine(editor: vscode.TextEditor, line: string) {
    return TextUtil.updateLine(editor, `/// @ts-check # ${ID} - ${line}`, this.TAG_LINE, 1);
  }

  static updateTypedefLine(editor: vscode.TextEditor, loc?: string) {
    return TextUtil.updateLine(editor, loc && `/// <reference types="${loc}" /> # ${ID}`, this.TYPEDEF, 2);
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
      await this.updateTagLine(editor, `found`);
      await this.updateTypedefLine(editor, loc);
      return true;
    } else {
      this.installCache.set(mod.full, loc);
      await this.updateTagLine(editor, `not found: ${loc.message}`);
      await this.updateTypedefLine(editor, undefined);
      return true;
    }
  }

  /**
   * Remove typedef
   */
  static async removeTypedef(doc: vscode.TextDocument) {
    const mod = this.extractModuleFromShebang(doc);
    if (mod) { // only with shebangs
      await TextUtil.removeLines(doc, this.TAG_LINE, this.TYPEDEF);
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