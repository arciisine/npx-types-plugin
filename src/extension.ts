import * as vscode from 'vscode';

import { EditorUtil } from './editor';
import { Util } from './util';
import { RunScriptUtil } from './run-script';


class Extension {

  /**
   * Get a valid doc
   */
  static isValidDocument(doc?: vscode.TextDocument, allowClosed = false) {
    return (
      doc &&
      (!doc.isClosed || allowClosed) &&
      doc.languageId === 'javascript'
    );
  }

  /**
   * Get a valid editor
   */
  static getValidEditor(editor?: vscode.TextEditor) {
    editor = editor ?? vscode.window.activeTextEditor;
    if (this.isValidDocument(editor?.document)) {
      return editor;
    }
  }

  /**
   * Run Script
   */
  static async runScript() {
    if (vscode.window.activeTextEditor) {
      await RunScriptUtil.run(vscode.window.activeTextEditor);
    }
  }

  /**
   * Run Script
   */
  static async reinstallModule() {
    if (vscode.window.activeTextEditor) {
      await EditorUtil.reinstallModule(vscode.window.activeTextEditor);
    }
  }

  /**
   * When an editor changes
   */
  static async onEditorChange(editor?: vscode.TextEditor) {
    editor = this.getValidEditor(editor);
    if (editor) {
      await EditorUtil.processEditor(editor);
    }
  }

  /**
   * Cleanup on close doc
   */
  static onCloseDocument(doc: vscode.TextDocument) {
    if (this.isValidDocument(doc, true)) {
      EditorUtil.removeTypedef(doc);
    }
  }

  /**
   * Activate extension
   */
  static activate(context: vscode.ExtensionContext) {
    // Debounce editor change
    this.onEditorChange = Util.debounce(this.onEditorChange.bind(this), 500);
    // On load/open/change
    vscode.window.onDidChangeVisibleTextEditors(() => this.onEditorChange, null, context.subscriptions);
    // On open
    vscode.workspace.onDidOpenTextDocument(() => this.onEditorChange(), null, context.subscriptions);
    // On Save
    vscode.workspace.onDidSaveTextDocument(() => this.onEditorChange(), null, context.subscriptions);
    // On close
    vscode.workspace.onDidCloseTextDocument(this.onCloseDocument.bind(this), null, context.subscriptions);
    // All on load
    setTimeout(() => this.onEditorChange, 1000);

    // Track subs
    context.subscriptions.push(
      // Register run command
      vscode.commands.registerCommand('npx-scripts.run', this.runScript.bind(this)),
      // Register re-download command
      vscode.commands.registerCommand('npx-scripts.re-install', this.reinstallModule.bind(this))
    );
  }

  static async deactivate() {
  }
}

export function activate(context: any) { Extension.activate(context) };
export function deactivate() { Extension.deactivate(); };