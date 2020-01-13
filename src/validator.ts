import * as vscode from 'vscode';

import { VSCodeUtil } from './vscode';
import { EditorUtil } from './util/editor';
import { Util } from './util/util';

const log = Util.log.bind(null, 'VALIDATOR');

/**
 * 
 */
export function ValidEditorCommand(debounce = true): MethodDecorator {
  return ((target: object, prop: string | symbol, desc: TypedPropertyDescriptor<(editor: vscode.TextEditor) => Promise<any>>) => {
    const og = desc.value!;
    let running: Promise<any> | undefined;

    desc.value = async function (this: any, ed, ...args: any[]) {
      if (debounce && running) {
        return running;
      }

      ed = EditorUtil.getEditor(ed ?? vscode.window.activeTextEditor)!
      const doc = ed?.document;

      if (doc && doc.languageId === 'javascript' && !doc.isClosed) {

        const mod = EditorUtil.getModuleFromShebang(doc);

        // Track to see if module is present
        await vscode.commands.executeCommand('setContext', 'npxScriptsModulePresent', !!mod);

        if (mod) {
          try {
            log('Calling', og.name);
            running = await (og as any).call(target, ed, ...args);
            return running;
          } finally {
            running = undefined
            log('Returning From', og.name);
          }
        } else {
          VSCodeUtil.setCodeLenses(doc);
        }
      }
    };
    Object.defineProperty(desc.value, 'name', { get() { return og.name; } });

    vscode.commands.registerCommand(VSCodeUtil.functionToCommand(og.name), desc.value);
  }) as MethodDecorator;
}