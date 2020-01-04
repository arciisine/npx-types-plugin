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
  static async updateLine(editor: vscode.TextEditor, text: string, regex: RegExp, defPos: number) {
    const found = this.findLine(editor, regex);
    const line = found?.lineNumber ?? defPos;
    const mode = found ? 'replace' : 'insert';


    const now = editor.document.lineAt(line);
    const pos = new vscode.Position(line, 0);

    if (mode === 'replace') {
      if (now.text === text) { // Same line
        return; // Do not update if the same
      }
      await editor.edit(e => e.replace(new vscode.Range(pos, new vscode.Position(line, now.text.length)), ''));
    } else {
      await editor.edit(e => e.insert(pos, '\n'));
    }

    return await editor.edit((edit) => {
      edit[mode](pos, text);
    });
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