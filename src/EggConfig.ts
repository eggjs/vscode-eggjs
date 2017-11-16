'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { fs } from 'mz';
import * as clearModule from 'clear-module';
import * as globby from 'globby';
import * as homedir from 'node-homedir';
import * as is from 'is-type-of';
import { ExtensionContext, workspace, window, commands, TextDocument, Position, Definition, Location, Range } from 'vscode';
import TreeProvider from './TreeProvider';
import { FileCache } from './FileUtils';
import * as ASTUtils from 'egg-ast-utils';

import { TreeItem, FileTreeItem, UrlTreeItem, ICON } from './TreeItem';

export async function init(context: ExtensionContext) {
  const cwd = workspace.rootPath;
  const treeProvider = new EggConfigProvider(cwd);
  window.registerTreeDataProvider('eggConfig', treeProvider);
  commands.registerCommand('eggConfig.refreshEntry', () => treeProvider.refresh());

  // monitor config files
  const fileCache = new FileCache('**/config/config.*.js', (content, uri) => {
    return ASTUtils.parseNormal(content);
  });
  context.subscriptions.push(fileCache);

  const w = workspace.createFileSystemWatcher('**/run/application_config_meta.json');
  w.onDidChange(async uri => {
    const a = await fs.stat(uri.fsPath);
    console.log('change', uri, a);
  });

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider('javascript', {
      async provideDefinition(document: TextDocument, position: Position): Promise<Definition> {
        const line = document.lineAt(position);
        // extract the closest word
        const wordRange = document.getWordRangeAtPosition(position);
        const word = document.getText(wordRange);
        // extract the closest `config.xxx`
        const part = line.text.substring(0, wordRange.end.character);
        const m = part.match(new RegExp(`\\bconfig\\.((?:\\w+\\.)*${word})$`));
        const property = m && m[1];

        if (property) {
          const files = await fileCache.readFiles('**/config/config.*.js', 'node_modules');
          const result = [];
          for (const { content, uri } of files) {
            const configNode = content.get(property);
            if (configNode) {
              for (const node of configNode.nodes) {
                console.log(node)
                const start = new Position(node.loc.start.line - 1, node.loc.start.column);
                const end = new Position(node.loc.end.line -1, node.loc.end.column);
                const range = new Range(start, end);
                const loc = new Location(uri, range);
                result.push(loc);
              }
            }
          }
          return result;
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