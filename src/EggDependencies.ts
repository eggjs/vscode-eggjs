'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as globby from 'globby';

export class EggDependenciesProvider implements vscode.TreeDataProvider<Node> {

  private _onDidChangeTreeData: vscode.EventEmitter<Node | undefined> = new vscode.EventEmitter<Node | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Node | undefined> = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {

  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Node): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Node): Thenable<Node[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace');
      return Promise.resolve([]);
    }

    return new Promise(resolve => {
      if (element) {
        resolve(element.getChildren());
      } else {
        resolve(new RootNode('', this.workspaceRoot).getChildren());
      }
    });
  }
}

const ICON = {
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
};

abstract class Node extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly leaf: boolean = false,
  ) {
    super(label, leaf ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = 'dependency';
  }

  async getChildren(): Promise<Node[]> { return [] };
}

class RootNode extends Node {
  constructor(
    public readonly label: string,
    public readonly path: string,
  ) {
    super(label, false);
  }

  async getChildren(): Promise<Node[]> {
    const cwd = path.join(this.path, 'node_modules');
    const result = await globby([ 'egg*/', '@*/egg*/' ], { cwd });
    // console.log(result);
    const nodeList = result.map(item => {
      const node = new EggNode(item.substring(0, item.length - 1), path.join(cwd, item));
      return node;
    });
    return nodeList;
  }
}

class EggNode extends Node {
  constructor(
    public readonly label: string,
    public readonly path: string,
  ) {
    super(label, false);
  }

  async getChildren(): Promise<Node[]> {
    const result = [];
    const pkgInfo = require(path.join(this.path, 'package.json'));

    // README, GITHUB
    const readmeNode = new FileNode('README', path.join(this.path, 'README.md'), ICON.README);
    result.push(readmeNode);

    if (pkgInfo.homepage) {
      const homeNode = new UrlNode('HomePage', pkgInfo.homepage, ICON.HOME);
      result.push(homeNode);
    }

    let registryUrl = pkgInfo.publishConfig && pkgInfo.publishConfig.registry;
    if (registryUrl && registryUrl.includes('npm.alibaba-inc.com')) {
      const npmNode = new UrlNode('tnpm', `http://web.npm.alibaba-inc.com/package/${this.label}`, ICON.NPM);
      result.push(npmNode);
    } else {
      const npmNode = new UrlNode('npm', `https://www.npmjs.com/package/${this.label}`, ICON.NPM);
      result.push(npmNode);
    }

    return result;
  }
}

class FileNode extends Node {
  constructor(
    public readonly label: string,
    public readonly path: string,
    public readonly iconPath: string,
  ) {
    super(label, true);
    // TODO: only expand one
    this.command = {
      command: 'extension.openFile',
      title: '',
      arguments: [ path ],
    };
  }
}

class UrlNode extends Node {
  constructor(
    public readonly label: string,
    public readonly url: string,
    public readonly iconPath: string,
  ) {
    super(label, true);
    this.command = {
      command: 'vscode.open',
      title: '',
      arguments: [ vscode.Uri.parse(url) ],
    };
  }
}
