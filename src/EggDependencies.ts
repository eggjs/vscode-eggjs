'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { fs } from 'mz';
import * as globby from 'globby';
import TreeProvider from './TreeProvider';

import { TreeItem, FileTreeItem, UrlTreeItem, ICON } from './TreeItem';

export function init(context: vscode.ExtensionContext) {
  const { commands, workspace, window, Uri } = vscode;
  const rootPath = workspace.rootPath;
  const treeProvider = new EggDependenciesProvider(rootPath);
  window.registerTreeDataProvider('eggDependencies', treeProvider);
  commands.registerCommand('eggDependencies.refreshEntry', () => treeProvider.refresh());
}

export class EggDependenciesProvider extends TreeProvider {
  async getRootNodes(): Promise<TreeItem[]> {
    const cwd = path.join(this.workspaceRoot, 'node_modules');
    const result = await globby(['egg*/', '@*/egg*/'], { cwd });
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
