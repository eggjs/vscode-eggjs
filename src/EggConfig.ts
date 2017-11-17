'use strict';

import * as path from 'path';
import { fs } from 'mz';
import * as getByPath from 'lodash.get';
import * as vscode from 'vscode';
import { ExtensionContext, workspace, window, commands, TextDocument, Position, Definition, Location, Range, Uri } from 'vscode';
import * as clearModule from 'clear-module';
import * as globby from 'globby';
import * as homedir from 'node-homedir';
import * as is from 'is-type-of';
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
  const fileCache = new FileCache('**/config/config.*.js', {
    parserFn: ASTUtils.parseConfig,
  });
  context.subscriptions.push(fileCache);

  const metaCache = new FileCache('**/run/application_config_meta.json', { json: true });
  context.subscriptions.push(metaCache);

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider('javascript', {
      async provideDefinition(document: TextDocument, position: Position): Promise<Definition> {
        const line = document.lineAt(position);
        let lineSource = line.text;
        let property;

        try {
          // pass the line to AST
          // need to process invalid like `return app.config.xxx;`
          // simplely find the blank space
          const start = lineSource.lastIndexOf(' ', position.character) + 1;
          const end = lineSource.indexOf(' ', position.character);
          const source = lineSource.substring(start, end === -1 ? undefined : end);
          property = ASTUtils.extractKeyword(source, position.character - start, 'config');
        } catch (err) {
          console.warn('extractKeyword', lineSource, err);
          // fallback to vscode way
          // extract the closest word
          const wordRange = document.getWordRangeAtPosition(position);
          const word = document.getText(wordRange);
          // extract the closest `config.xxx`, don't support `config.view['.nj']`
          const part = line.text.substring(0, wordRange.end.character);
          const m = part.match(new RegExp(`\\bconfig\\.((?:\\w+\\.)*${word})$`));
          property = m && m[1];
        }

        if (property) {
          const result = [];

          // search from app config files
          const files = await fileCache.readFiles('**/config/config.*.js', 'node_modules');
          for (const { content, uri } of files) {
            result.push(...extractLocation(content, property, uri));

            // search from meta
            const cwd = workspace.getWorkspaceFolder(document.uri).uri.fsPath;
            const meta = await metaCache.readFile(Uri.file(path.join(cwd, 'run/application_config_meta.json')));
            const filePath = getByPath(meta, property);
            if (is.string(filePath) && !filePath.startsWith(path.join(cwd, 'config'))) {
              const pluginUri = Uri.file(filePath);
              const pluginContent = await fileCache.readFile(pluginUri, false);
              result.push(...extractLocation(pluginContent, property, pluginUri));
            }
          }
          return result;
        }
      }
    })
  );
}

function extractLocation(source, property, uri) {
  const result = []
  const configNode = source.find(property);
  for (const node of configNode) {
    const { start, end } = node.node.loc;
    const range = new Range(new Position(start.line - 1, start.column), new Position(end.line - 1, end.column));
    const loc = new Location(uri, range);
    result.push(loc);
  }
  return result;
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