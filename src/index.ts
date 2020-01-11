import * as vscode from 'vscode';

import { EditorUtil } from './util/editor';
import { ScriptRunner } from './run';
import { VSCodeUtil } from './vscode';
import { ValidEditorCommand } from './validator';


class Extension {

  /**
   * Verify typings
   */
  static async verifyTypings(editor: vscode.TextEditor) {
    const { document: doc } = editor;
    const result = await EditorUtil.verifyTypings(doc);
    const typings = EditorUtil.getTypingsPath(doc);

    switch (result) {
      case 'valid': {
        VSCodeUtil.setCodeLenses(doc,
          { title: 'Reinstall npx typings', command: this.addTypings },
          { title: 'Remove npx typings', command: this.removeTypings }
        );
        break;
      }
      case 'invalid-typings': {
        VSCodeUtil.setCodeLenses(doc,
          { title: 'Fix npx typings', command: this.addTypings },
          { title: 'Remove npx typings', command: this.removeTypings }
        );

        VSCodeUtil.promptAction(doc, 'info',
          `Your current typings points to an invalid location (${typings}).  Do you want to reinstall?`,
          { command: this.addTypings, title: 'Reinstall' }
        );
        break;
      }
      case 'missing-typings': {
        VSCodeUtil.setCodeLenses(doc,
          { title: 'Add npx typings', command: this.addTypings }
        );

        const mod = EditorUtil.getModuleFromShebang(doc)!;
        VSCodeUtil.promptAction(doc, 'info',
          `Do you want to add typings for your shebang module ${mod.name}`,
          { command: this.addTypings, title: 'Install' }
        );
        break;
      }
      default: {
        VSCodeUtil.setCodeLenses(doc);
      }
    }
  }

  @ValidEditorCommand()
  static noop() {
    // Do nothing
  }

  /**
   * Run Script
   */
  @ValidEditorCommand()
  static async runScript({ document }: vscode.TextEditor) {
    await ScriptRunner.run(document);
  }

  /**
   * Run Script with script
   */
  @ValidEditorCommand()
  static async runScriptWithInput({ document }: vscode.TextEditor) {
    const [file] = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      openLabel: 'Select file for npx script input'
    }) ?? [];
    await ScriptRunner.run(document, VSCodeUtil.resolveToRelativePath(file));
  }

  /**
   * Reinstall module
   */
  @ValidEditorCommand()
  static async reinstallModule(editor: vscode.TextEditor) {
    await EditorUtil.reinstallModule(editor);
    await editor.document.save();
    await this.verifyTypings(editor);
  }

  /**
   * Add typings to doc
   */
  @ValidEditorCommand()
  static async addTypings(editor: vscode.TextEditor) {
    const res = await EditorUtil.addTypings(editor);
    const { document: doc } = editor;

    if (res instanceof Error) {
      const mod = EditorUtil.getModuleFromShebang(doc);
      await VSCodeUtil.promptAction(doc, 'error', `Unable to install typings for ${mod!.full}: ${res.message}`,
        { title: 'Dismiss', command: this.noop });
    } else {
      await this.verifyTypings(editor);
    }
  }

  /**
   * Removing typings from doc
   */
  @ValidEditorCommand()
  static async removeTypings(editor: vscode.TextEditor) {
    await EditorUtil.removeTypings(editor);
    VSCodeUtil.markAsPrompted(editor.document);

    await this.verifyTypings(editor);
  }

  /**
   * Check typings in doc
   */
  @ValidEditorCommand()
  static async checkTypings(editor: vscode.TextEditor) {
    return await this.verifyTypings(editor);
  }

  /**
   * Activate extension
   */
  static activate(context: vscode.ExtensionContext) {
    // Track subscriptions
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument(this.checkTypings as any),
      vscode.workspace.onDidOpenTextDocument(this.checkTypings as any),
      vscode.window.onDidChangeActiveTextEditor(this.checkTypings as any),
    );

    VSCodeUtil.activate(context);
    ScriptRunner.activate(context);
    // All on load
    setTimeout(this.checkTypings as any, 1000);
  }

  static async deactivate() { }
}

export function activate(context: vscode.ExtensionContext) { Extension.activate(context) };
export function deactivate() { Extension.deactivate(); };