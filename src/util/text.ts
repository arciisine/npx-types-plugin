import * as vscode from 'vscode';
import { Util } from './util';
import { promises as fs } from 'fs';

export class TextUtil {

  private static mapping: Record<string, string> = { ' ': '\\s+', '_': '\\s*' };

  /**
   * Templatizes the regex
   */
  static templateRe(re: RegExp, tok: string) {
    const out = new RegExp(
      re.source
        .replace('$ID', tok)
        .replace(/[ _]/g, a => this.mapping[a]),
      'm'
    );
    return out;
  }

  /**
   * Find first line with pattern
   */
  static findLine(doc: vscode.TextDocument, pat: RegExp) {
    for (let line = 0; line < doc.lineCount; line += 1) {
      if (pat.test(doc.lineAt(line).text)) {
        return doc.lineAt(line);
      }
    }
  }

  /**
   * Treat line to test for comparison
   */
  static forCompare(line: string) {
    return line.toLowerCase().replace(/\s+/g, '');
  }

  /**
   * Update line in an editor
   */
  static async updateLine(editor: vscode.TextEditor, text: string | undefined, regex: RegExp, defLine: number) {
    return await editor.edit(cmd => {
      const found = this.findLine(editor.document, regex);

      if (text === undefined) { // Delete
        if (found) {
          cmd.delete(found.rangeIncludingLineBreak);
        }
      } else if (found) { // Replace
        const now = editor.document.lineAt(found.lineNumber);
        if (this.forCompare(now.text) !== this.forCompare(text)) { // If line changed         
          cmd.replace(now.range, text);
        }
      } else { // Insert
        // Ensure line for insert
        const last = editor.document.lineAt(editor.document.lineCount - 1);
        if (defLine >= last.lineNumber) {
          cmd.insert(last.range.end, '\n'.repeat(defLine - last.lineNumber));
        }
        cmd.insert(new vscode.Position(defLine, 0), `${text}\n`)
      }
    });
  }

  /**
   * Return match by group number from regex
   */
  static extractMatch(doc: vscode.TextDocument, regex: RegExp, group: number = 1) {
    const line = this.findLine(doc, regex);
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
   * Remove content from file
   */
  static async removeLines(docOrEd: vscode.TextEditor | vscode.TextDocument, ...regexes: RegExp[]) {
    if ('document' in docOrEd) {
      for (const regex of regexes) {
        await this.updateLine(docOrEd, undefined, regex, -1);
      }
      await docOrEd.document.save();
    } else {
      const doc = docOrEd;
      if (await Util.exists(doc.fileName)) {
        try {
          const linesToExclude = new Set<number>();
          for (const regex of regexes) {
            const found = this.findLine(doc, regex);
            if (found) {
              linesToExclude.add(found.lineNumber);
            }
          }
          if (linesToExclude.size > 0) {
            const content = doc.getText()
              .split('\n')
              .filter((el, i) => !linesToExclude.has(i))
              .join('\n');
            await fs.writeFile(doc.fileName, content, 'utf8');
          }
        } catch { }
      }
    }
  }
}