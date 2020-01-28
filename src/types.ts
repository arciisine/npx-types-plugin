import * as vscode from 'vscode';

export const ID = 'npx-scripts';
export const IDC = 'npxScripts';

export class Mod {
  name: string;
  version?: string;

  constructor(public full: string = '') {
    let splitAt = full.indexOf('@', 1); // Find interior @
    if (splitAt >= 0) {
      this.name = full.substring(0, splitAt);
      this.version = full.substring(splitAt + 1);
    } else {
      this.name = full;
    }
  }

  get safe() {
    return this.full.replace(/[@/]/g, '.').replace(/(^[.]+)|([.]+$)/, '').replace(/[.][.]+/, '.');
  }
}

export type TYPINGS_STATE = 'no-module' | 'no-typings' | 'missing-typings' | 'invalid-typings' | 'valid';
export type INSTALL_STATE = 'preinstalled' | 'success';

export type PackageJson = {
  name: string;
  displayName: string;
  description?: string;
  types?: string;
  version: string;
  homepage?: string;
  keywords?: string[];
  author: {
    email: string,
    name: string
  };
  repository?: {
    url: string
  };
  bin?: Record<string, string>;
  main?: string
  scripts: Record<string, string>;
  files?: string[];
  contributes?: {
    commands?: {
      command: string;
    }[]
  };
  devDependencies: Record<string, string>;
  dependencies: Record<string, string>;
};

export type ExtCommand = Omit<vscode.Command, 'command'> & { command: Function };
