import * as vscode from 'vscode';
import { ModuleUtil } from './module';
import { Mod, ID, INSTALL_STATE, TYPINGS_STATE } from '../types';
import { TextUtil } from './text';
import { Util } from './util';

const log = Util.log.bind(null, 'TYPINGS')

export class EditorUtil {

  static TS_CHECK = TextUtil.templateRe(/^\/{3}_@ts-check$/, ID);
  static TYPINGS = TextUtil.templateRe(/^\/{3}_<reference types_=_"([^"\n]+)" lib_=_"$ID"_\/>_$/, ID);
  static SHEBANG = TextUtil.templateRe(/^#!\/.*?(?:\/| )npx ((?:@\w+\/)?\w+(?:@\S+)?)_.*$/, '');

  /**
   * Get editor, as editor, by document, or by uri
   */
  static getEditor(editor?: vscode.TextEditor | vscode.TextDocument | vscode.Uri) {
    if (editor) {
      if (!('document' in editor)) {
        const loc = editor instanceof vscode.Uri ? editor.fsPath : editor.uri.fsPath;
        return vscode.window.visibleTextEditors.find(x => x.document.uri.fsPath === loc);
      } else {
        return editor;
      }
    }
  }

  /**
   * Get the whole shebang
   */
  static getShebang(doc: vscode.TextDocument) {
    const { text } = doc.lineAt(0);
    return text.startsWith('#!') ? text : undefined;
  }

  /**
   * Match on module name in shebang
   */
  static getModuleFromShebang(doc: vscode.TextDocument): Mod | undefined {
    const text = this.getShebang(doc);
    if (text) {
      const match = text.replace(this.SHEBANG, (a, b) => b);
      return match ? new Mod(match) : undefined;
    }
  }

  /**
   * Read path from npx loaded typings
   */
  static getTypingsPath(doc: vscode.TextDocument) {
    return TextUtil.extractMatch(doc, this.TYPINGS, 1);
  }

  /**
   * Set ts-check
   */
  static setTsCheck(editor: vscode.TextEditor) {
    return TextUtil.updateLine(editor, `/// @ts-check`, this.TS_CHECK, 1);
  }

  /**
   * Update typings line
   */
  static updateTypingsLine(editor: vscode.TextEditor, loc?: string) {
    return TextUtil.updateLine(editor, loc && `/// <reference types="${loc}" lib="${ID}" />`, this.TYPINGS, 2);
  }

  /**
   * Install module
   */
  static async installModule(editor: vscode.TextEditor, mod: Mod, force = false): Promise<INSTALL_STATE | Error> {
    try {
      // Now installing
      await this.updateTypingsLine(editor, undefined);

      const installed = await ModuleUtil.install(mod, force);
      await this.setTsCheck(editor);
      await this.updateTypingsLine(editor, installed);
      await editor.document.save();
      return 'success';
    } catch (err) {
      await this.updateTypingsLine(editor, undefined);
      return err;
    }
  }

  /**
   * Re-download module
   */
  static async reinstallModule(editor: vscode.TextEditor) {
    const mod = this.getModuleFromShebang(editor.document)!;
    await this.installModule(editor, mod, true);
  }


  /**
   * Remove typings
   */
  static async removeTypings(doc: vscode.TextEditor | vscode.TextDocument) {
    const mod = this.getModuleFromShebang('document' in doc ? doc.document : doc);
    if (mod) { // only with shebangs
      log('Removing typings from doc');
      await TextUtil.removeLines(doc, this.TS_CHECK, this.TYPINGS);
    }
  }

  /**
   * Verify typings exist, and ensure the editor is in sync with reality
   */
  static async verifyTypings(doc: vscode.TextDocument): Promise<TYPINGS_STATE> {
    const mod = this.getModuleFromShebang(doc)!;
    const typingsPath = this.getTypingsPath(doc);

    log('Verifying typings in editor');

    // Honor path if valid install
    if (typingsPath && await ModuleUtil.validateInstallation(mod, typingsPath)) {
      return 'valid';
    }

    if (typingsPath) {
      return 'invalid-typings';
    } else {
      if (await ModuleUtil.verifyModuleHasTypes(mod)) {
        return 'missing-typings';
      } else {
        return 'no-typings';
      }
    }
  }

  /**
   * Process an editor, install typings if needed
   */
  static async addTypings(editor: vscode.TextEditor): Promise<INSTALL_STATE | Error> {
    log('Adding typings to editor');

    if (await this.verifyTypings(editor.document) === 'valid') {
      log('Typings valid and already installed');
      return 'preinstalled';
    }

    const mod = this.getModuleFromShebang(editor.document)!;
    const res = await this.installModule(editor, mod);
    return res;
  }
}