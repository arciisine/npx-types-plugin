import * as vscode from 'vscode';
import { ExtCommand, ID } from './types';

/**
 * Helper for the extension
 */
export class VSCodeUtil {
  private static messaging = {
    error: vscode.window.showErrorMessage,
    info: vscode.window.showInformationMessage,
    warn: vscode.window.showWarningMessage,
  } as const;

  private static codeLenses = new Map<string, vscode.CodeLens[]>();
  private static prompted = new Set<string>();
  private static codeLensEmitter = new vscode.EventEmitter<void>();

  static onDidChangeCodeLenses: vscode.Event<void>;

  /**
   * Mark document as prompted
   */
  static async markAsPrompted(document: vscode.TextDocument) {
    this.prompted.add(document.fileName);
  }

  /**
   * Prompt an action
   */
  static async promptAction(document: vscode.TextDocument, level: 'error' | 'info' | 'warn',
    message: string, ...actions: ExtCommand[]
  ) {
    const { fileName } = document;
    if (this.prompted.has(fileName)) {
      return;
    }
    this.markAsPrompted(document);

    const inst = this.messaging[level](message, ...actions.map(x => x.title));

    await inst.then(async res => {
      const cmd = actions.find(x => x.title === res);
      if (cmd) {
        await vscode.commands.executeCommand(this.functionToCommand(cmd.command.name))
      }
    });
  }

  /**
   * Set code lenses and fire
   */
  static setCodeLenses(doc: vscode.TextDocument, ...lenses: ExtCommand[]) {
    const range = doc.lineAt(0).range;
    if (lenses.length) {
      this.codeLenses.set(doc.fileName, lenses.map(cmd => {
        return new vscode.CodeLens(range, { ...cmd, command: this.functionToCommand(cmd.command.name) });
      }));
    } else {
      this.codeLenses.delete(doc.fileName);
    }
    this.codeLensEmitter.fire();
  }

  /**
   * Get code lenses
   */
  static provideCodeLenses(doc: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] {
    return this.codeLenses.get(doc.fileName) ?? [];
  }

  /**
   * Resolve path to relative location
   */
  static resolveToRelativePath(uri?: vscode.Uri | string) {
    const base = vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? process.cwd();
    if (uri) {
      const path = (typeof uri === 'string' ? uri : uri.fsPath).replace(/[/]+$/g, '');
      return path.replace(base, '.');
    } else {
      return base;
    }
  }

  /**
   * Function name to command name
   */
  static functionToCommand(fn: string) {
    return [
      ID,
      fn
        .replace(/^\S+\s+/g, '')
        .replace(/([a-z])([A-Z])/g, (a, l, r) => `${l}-${r.toLowerCase()}`)
    ].join('.');
  }

  /**
   * Command name to method name
   */
  static commandToFunction(cmd: string) {
    return cmd
      .replace(/^[^.]+[.]/g, '')
      .replace(/([a-z])-([a-z])/g, (a, l, r) => `${l}${r.toUpperCase()}`);
  }

  /**
   * Activate
   */
  static activate(ctx: vscode.ExtensionContext) {
    this.onDidChangeCodeLenses = this.codeLensEmitter.event;
    ctx.subscriptions.push(this.codeLensEmitter);
    vscode.languages.registerCodeLensProvider('javascript', this);
  }
}