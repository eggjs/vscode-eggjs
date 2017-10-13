'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { fs } from 'mz';
import * as clearModule from 'clear-module';
import * as globby from 'globby';
import * as homedir from 'node-homedir';
import * as is from 'is-type-of';
import TreeProvider from './TreeProvider';

import { TreeItem, FileTreeItem, UrlTreeItem, ICON } from './TreeItem';

export function init(context: vscode.ExtensionContext) {
  const { commands, workspace, window, Uri } = vscode;
  const rootPath = workspace.rootPath;
  const treeProvider = new EggConfigProvider(rootPath);
  window.registerTreeDataProvider('eggConfig', treeProvider);
  commands.registerCommand('eggConfig.refreshEntry', () => treeProvider.refresh());
}

export class EggConfigProvider extends TreeProvider {
  constructor(protected workspaceRoot: string) {
    super(workspaceRoot);
    // const watcher = vscode.workspace.createFileSystemWatcher('config/config.*.js');
    const prefix = path.join(workspaceRoot, 'config/config.');
    vscode.workspace.onDidSaveTextDocument(e => {
      if (e.fileName.startsWith(prefix)) {
        this.refresh();
      }
    })
  }

  async getRootNodes(): Promise<TreeItem[]> {
    const cwd = path.join(this.workspaceRoot, 'config');
    const result = await globby(['config.*.js'], { cwd });
    const pkgInfo = require(path.join(this.workspaceRoot, 'package.json'));
    const HOME = homedir();

    const nodeList = result.map(item => {
      const appInfo = {
        pkg: pkgInfo,
        name: pkgInfo.name,
        baseDir: this.workspaceRoot,
        HOME,
        root: (item === 'config.local.js' || item === 'config.unittest.js') ? this.workspaceRoot : HOME,
      };
      const node = new EggConfigTreeItem(item, path.join(cwd, item), appInfo);
      return node;
    });
    return nodeList;
  }
}

class RootTreeItem extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly path: string,
  ) {
    super(label, false);
  }

  async getChildren(): Promise<TreeItem[]> {
    const cwd = path.join(this.path, 'config');
    const result = await globby([ 'config.*.js' ], { cwd });
    const pkgInfo = require(path.join(this.path, 'package.json'));
    const HOME = homedir();

    const nodeList = result.map(item => {
      const appInfo = {
        pkg: pkgInfo,
        name: pkgInfo.name,
        baseDir: this.path,
        HOME,
        root: (item === 'config.local.js' || item === 'config.unittest.js') ? this.path : HOME,
      };
      const node = new EggConfigTreeItem(item, path.join(cwd, item), appInfo);
      return node;
    });
    return nodeList;
  }
}

class EggConfigTreeItem extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly path: string,
    public readonly appInfo: object,
  ) {
    super(label, false);
  }

  async getChildren(): Promise<TreeItem[]> {
    clearModule(this.path);
    let config = require(this.path);
    if (is.function(config)) {
      config = config(this.appInfo);
    }

    const root = new JSONTreeItem(this.path, '', config);
    const result = await root.getChildren();
    return result;
  }
}

class JSONTreeItem extends TreeItem {
  private data: any;
  private filePath: string;

  constructor(
    filePath: string,
    key: string,
    data: any,
  ) {
    let label: string;
    let leaf: boolean;
    let iconPath: any;

    if (is.array(data)) {
      label = key;
      iconPath = ICON.ARRAY;
    } else if (is.object(data)) {
      label = key;
      iconPath = ICON.JSON;
    } else if (is.boolean(data)) {
      label = `${key}: ${data}`;
      leaf = true;
      iconPath = ICON.BOOLEAN;
    } else if (is.number(data)) {
      label = `${key}: ${data}`;
      leaf = true;
      iconPath = ICON.NUMBER;
    } else if (is.string(data)) {
      label = `${key}: "${data}"`;
      leaf = true;
      iconPath = ICON.STRING;
    }

    super(label, leaf, iconPath);
    this.data = data;
    this.filePath = filePath;
    this.command = {
      command: 'extension.openFile',
      title: '',
      arguments: [ filePath ],
    }
  }

  async getChildren(): Promise<JSONTreeItem[]> {
    const result = [];
    for (const key of Object.keys(this.data)) {
      const data = this.data[key];
      const treeItem = new JSONTreeItem(this.filePath, key, data);
      result.push(treeItem);
    }

    return result;
  }
}