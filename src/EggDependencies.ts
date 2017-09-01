'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as globby from 'globby';
import { TreeItem, FileTreeItem, UrlTreeItem } from './TreeItem';

export class EggDependenciesProvider implements vscode.TreeDataProvider<TreeItem> {

  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> = new vscode.EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {

  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): Thenable<TreeItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace');
      return Promise.resolve([]);
    }

    return new Promise(resolve => {
      if (element) {
        resolve(element.getChildren());
      } else {
        resolve(new RootTreeItem('', this.workspaceRoot).getChildren());
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

class RootTreeItem extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly path: string,
  ) {
    super(label, false);
  }

  async getChildren(): Promise<TreeItem[]> {
    const cwd = path.join(this.path, 'node_modules');
    const result = await globby([ 'egg*/', '@*/egg*/' ], { cwd });
    // console.log(result);
    const nodeList = result.map(item => {
      const node = new EggTreeItem(item.substring(0, item.length - 1), path.join(cwd, item));
      return node;
    });
    return nodeList;
  }
}

class EggTreeItem extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly path: string,
  ) {
    super(label, false);
  }

  async getChildren(): Promise<TreeItem[]> {
    const result = [];
    const pkgInfo = require(path.join(this.path, 'package.json'));

    // README, GITHUB
    const readmeNode = new FileTreeItem('README', path.join(this.path, 'README.md'), ICON.README);
    result.push(readmeNode);

    if (pkgInfo.homepage) {
      const homeNode = new UrlTreeItem('HomePage', pkgInfo.homepage, ICON.HOME);
      result.push(homeNode);
    }

    let registryUrl = pkgInfo.publishConfig && pkgInfo.publishConfig.registry;
    if (registryUrl && registryUrl.includes('npm.alibaba-inc.com')) {
      const npmNode = new UrlTreeItem('tnpm', `http://web.npm.alibaba-inc.com/package/${this.label}`, ICON.NPM);
      result.push(npmNode);
    } else {
      const npmNode = new UrlTreeItem('npm', `https://www.npmjs.com/package/${this.label}`, ICON.NPM);
      result.push(npmNode);
    }

    return result;
  }
}
