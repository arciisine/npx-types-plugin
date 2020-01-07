import * as vscode from 'vscode';
import { Util } from './util';
import { promises as fs } from 'fs';

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

  static forCompare(line: string) {
    return line.toLowerCase().replace(/\s+/g, '');
  }

  static async ensureLineAt(editor: vscode.TextEditor, line: number) {
    // Fill out space if adding data
    if (line >= editor.document.lineCount) {
      const last = editor.document.lineAt(editor.document.lineCount - 1);
      await editor.edit(e => e.insert(last.range.end, '\n'.repeat(line - editor.document.lineCount)));
    }
  }

  /**
   * Update line in an editor
   */
  static async updateLine(editor: vscode.TextEditor, text: string | undefined, regex: RegExp, defPos: number) {
    const found = this.findLine(editor, regex);

    if (text === undefined) { // Delete
      if (found) {
        await editor.edit(cmd => cmd.delete(found.rangeIncludingLineBreak));
      }
      return;
    } else if (found) { // Replace
      const now = editor.document.lineAt(found.lineNumber);
      if (this.forCompare(now.text) !== this.forCompare(text)) { // If line changed
        await editor.edit(e => e.replace(now.range, text));
      }
    } else { // Insert
      await this.ensureLineAt(editor, defPos);
      await editor.edit(e => e.insert(new vscode.Position(defPos, 0), `${text}\n`));
    }
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

  /**
   * Append line to editor
   * @param editor 
   * @param lines 
   */
  static async append(editor: vscode.TextEditor, ...lines: string[]) {
    await editor.edit((cmd) => {
      const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
      cmd.insert(lastLine.range.end, `\n${lines.join('\n')}`);
    });
  }

  /**
   * Remove content from file
   */
  static async removeContent(doc: vscode.TextDocument, regex: RegExp) {
    if (await Util.exists(doc.fileName)) {
      try {
        const content = doc.getText();
        if (regex.test(content)) { // Only update if pattern is found
          await fs.writeFile(doc.fileName, content.replace(regex, ''), 'utf8');
        }
      } catch { }
    }
  }
}