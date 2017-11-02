'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { fs } from 'mz';
import * as clearModule from 'clear-module';
import * as globby from 'globby';
import * as homedir from 'node-homedir';
import * as is from 'is-type-of';
import { ExtensionContext, workspace, window, commands, TextDocument, Position, Definition, Location } from 'vscode';
import TreeProvider from './TreeProvider';

import { TreeItem, FileTreeItem, UrlTreeItem, ICON } from './TreeItem';

export function init(context: ExtensionContext) {
  const cwd = workspace.rootPath;
  const treeProvider = new EggConfigProvider(cwd);
  window.registerTreeDataProvider('eggConfig', treeProvider);
  commands.registerCommand('eggConfig.refreshEntry', () => treeProvider.refresh());

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider([ 'javascript', 'typescript'], {
      async provideDefinition(document: TextDocument, position: Position): Promise<Definition> {
        const line = document.lineAt(position);
        const wordRange = document.getWordRangeAtPosition(position);
        const word = document.getText(wordRange);

        const part = line.text.substring(0, wordRange.end.character);
        const m = part.match(new RegExp(`\\bconfig\\.((?:\\w+\\.)*${word})$`));
        const property = m && m[1];

        if (property) {
          console.log(property);
          return [
            new Location(vscode.Uri.file(path.join(cwd, 'config/config.default.js')), new vscode.Range(new Position(12, 4), new Position(12, 29))),
            new Location(vscode.Uri.file(path.join(cwd, 'config/config.local.js')), new vscode.Range(new Position(3, 2), new Position(3, 22))),
          ];
        }
      }
    })
  );
}

export class EggConfigProvider extends TreeProvider {
  constructor(protected workspaceRoot: string) {
    super(workspaceRoot);
    // const watcher = vscode.workspace.createFileSystemWatcher('config/config.*.js');
    const prefix = path.join(workspaceRoot, 'config/config.');
    workspace.onDidSaveTextDocument(e => {
      if (e.fileName.startsWith(prefix)) {
        this.refresh();
      }
    })
  }

  async getRootNodes(): Promise<TreeItem[]> {
    const cwd = path.join(this.baseDir, 'config');
    const result = await globby(['config.*.js'], { cwd });
    const pkgInfo = require(path.join(this.baseDir, 'package.json'));
    const HOME = homedir();

    const nodeList = result.map(item => {
      const appInfo = {
        pkg: pkgInfo,
        name: pkgInfo.name,
        baseDir: this.baseDir,
        HOME,
        root: (item === 'config.local.js' || item === 'config.unittest.js') ? this.baseDir : HOME,
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