import * as vscode from 'vscode';

import { ModuleUtil } from './module';
import { EditorUtil } from './editor';
import { Util } from './util';
import { TerminalUtil } from './terminal';


class Extension {

  private static seen = new Map<string, vscode.TextDocument>();

  /**
   * Run Script
   */
  static async runScript() {
    if (vscode.window.activeTextEditor) {
      await TerminalUtil.runScript(vscode.window.activeTextEditor);
    }
  }

  /**
   * When a document is changed
   */
  static onDocumentChange(doc: vscode.TextDocument) {
    const editor = vscode.window.visibleTextEditors
      .find(x => x.document === doc);

    if (editor) {
      return this.onEditorChange(editor);
    }
  }

  /**
   * When an editor changes
   */
  static async onEditorChange(editor: vscode.TextEditor) {
    const doc = editor.document;
    if (doc.languageId === 'javascript') {
      const mod = EditorUtil.extractModuleFromShebang(editor);
      if (mod) {
        this.seen.set(doc.fileName, doc);
        await EditorUtil.processEditor(editor, mod);
      }
    }
  }

  /**
   * On Editor Changing
   */
  static async onEditorsChange(editors: vscode.TextEditor[]) {
    for (const e of editors) {
      await this.onEditorChange(e);
    }
  }

  /**
   * Cleanup on close doc
   */
  static onCloseDocument(doc: vscode.TextDocument) {
    if (this.seen.has(doc.fileName)) {
      return EditorUtil.removeTypedef(doc);
    }
  }

  /**
   * Activate extension
   */
  static activate(context: vscode.ExtensionContext) {
    // Debounce editor change
    this.onEditorChange = Util.debounce(this.onEditorChange.bind(this), 500);
    // On load/open/change
    vscode.window.onDidChangeVisibleTextEditors(this.onEditorsChange.bind(this), null, context.subscriptions);
    // On open
    vscode.workspace.onDidOpenTextDocument(this.onDocumentChange.bind(this), null, context.subscriptions);
    // On Save
    vscode.workspace.onDidSaveTextDocument(this.onDocumentChange.bind(this), null, context.subscriptions);
    // On close
    vscode.workspace.onDidCloseTextDocument(this.onCloseDocument.bind(this), null, context.subscriptions);
    // All on load
    setTimeout(this.onEditorsChange.bind(this, vscode.window.visibleTextEditors), 1000);
    // Register run command
    vscode.commands.registerCommand('npx-scripts.run', this.runScript);
  }

  static async deactivate() {
    await ModuleUtil.cleanup();
    for (const doc of this.seen.values()) {
      await this.onCloseDocument(doc);
    }
  }
}

export function activate(context: any) { Extension.activate(context) };
export function deactivate() { Extension.deactivate(); };