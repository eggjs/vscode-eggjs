import * as vscode from 'vscode';
import * as path from 'path';

export abstract class TreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly leaf: boolean = false,
    public readonly iconPath?: any,
  ) {
    super(label, leaf ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
    // this.contextValue = 'dependency';
  }

  async getChildren(): Promise<TreeItem[]> { return [] };
}

export class FileTreeItem extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly path: string,
    public readonly iconPath: any,
  ) {
    super(label, true);
    // TODO: only expand one
    this.command = {
      command: 'extension.openFile',
      title: '',
      arguments: [path],
    };
  }
}

export class UrlTreeItem extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly url: string,
    public readonly iconPath: any,
  ) {
    super(label, true);
    this.command = {
      command: 'vscode.open',
      title: '',
      arguments: [vscode.Uri.parse(url)],
    };
  }
}

export const ICON = {
  REFRESH: {
    light: path.join(__dirname, '../../resources/light/refresh.svg'),
    dark: path.join(__dirname, '../../resources/dark/refresh.svg'),
  },
  NPM: {
    light: path.join(__dirname, '../../resources/light/npm.svg'),
    dark: path.join(__dirname, '../../resources/dark/npm.svg'),
  },
  HOME: {
    light: path.join(__dirname, '../../resources/light/home.svg'),
    dark: path.join(__dirname, '../../resources/dark/home.svg'),
  },
  README: {
    light: path.join(__dirname, '../../resources/light/markdown.svg'),
    dark: path.join(__dirname, '../../resources/dark/markdown.svg'),
  },
  DEPENDENCY: {
    light: path.join(__dirname, '../../resources/light/dependency.svg'),
    dark: path.join(__dirname, '../../resources/dark/dependency.svg'),
  },
  DOCUMENT: {
    light: path.join(__dirname, '../../resources/light/document.svg'),
    dark: path.join(__dirname, '../../resources/dark/document.svg'),
  },
  NUMBER: {
    light: path.join(__dirname, '../../resources/light/number.svg'),
    dark: path.join(__dirname, '../../resources/dark/number.svg'),
  },
  STRING: {
    light: path.join(__dirname, '../../resources/light/string.svg'),
    dark: path.join(__dirname, '../../resources/dark/string.svg'),
  },
  BOOLEAN: {
    light: path.join(__dirname, '../../resources/light/boolean.svg'),
    dark: path.join(__dirname, '../../resources/dark/boolean.svg'),
  },
  ARRAY: {
    light: path.join(__dirname, '../../resources/light/array.svg'),
    dark: path.join(__dirname, '../../resources/dark/array.svg'),
  },
  JSON: {
    light: path.join(__dirname, '../../resources/light/json.svg'),
    dark: path.join(__dirname, '../../resources/dark/json.svg'),
  },
};