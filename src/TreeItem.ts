import * as vscode from 'vscode';

export abstract class TreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly leaf: boolean = false,
  ) {
    super(label, leaf ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = 'dependency';
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
