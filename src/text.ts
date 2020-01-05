import * as vscode from 'vscode';

export class TextUtil {

  /**
   * Find first line with pattern
   */
  static findLine(editor: vscode.TextEditor, pat: RegExp, ensure?: boolean) {
    const doc = editor.document;

    for (let line = 0; line < doc.lineCount; line += 1) {
      if (pat.test(doc.lineAt(line).text)) {
        return doc.lineAt(line);
      }
    }
  }

  /**
   * Update line in an editor
   */
  static async updateLine(editor: vscode.TextEditor, text: string | undefined, regex: RegExp, defPos: number) {
    const found = this.findLine(editor, regex);
    const line = found?.lineNumber ?? defPos;

    // Fill out space if adding data
    if (text && line >= editor.document.lineCount) {
      const last = editor.document.lineAt(editor.document.lineCount - 1);
      await editor.edit(e => e.insert(last.range.end, '\n'.repeat((line + 1) - editor.document.lineCount)));
    }

    const now = editor.document.lineAt(line);
    const pos = new vscode.Position(line, 0);
    const range = new vscode.Range(pos, new vscode.Position(line, now.text.length));

    let op: Parameters<typeof editor['edit']>[0];

    if (text === undefined) {
      op = edit => edit.delete(range);
    } else if (found) {
      if (now.text === text) { // Same line
        return; // Do not update if the same
      }
      await editor.edit(e => e.replace(range, ''));
      op = edit => edit.replace(pos, text);
    } else {
      await editor.edit(e => e.insert(pos, '\n'));
      op = edit => edit.insert(pos, text);
    }

    return await editor.edit(op);
  }

  /**
   * Return match by group number from regex
   */
  static extractMatch(editor: vscode.TextEditor, regex: RegExp, group: number = 1) {
    const line = this.findLine(editor, regex);
    if (line === undefined) {
      return;
    }

    const { text } = line;
    let out = '';
    text.replace(regex, (all, ...rest) =>
      out = rest[group - 1]
    );
    return out;
  }
}