'use strict';

import * as path from 'path';
import * as is from 'is-type-of';
import { fs } from 'mz';
import * as getByPath from 'lodash.get';
import { FileCache } from './FileUtils';
import * as ASTUtils from 'egg-ast-utils';

import * as vscode from 'vscode';
import { ExtensionContext, workspace, window, commands, TextDocument, Position, Definition, Location, Range, Uri } from 'vscode';

import { TreeItem, FileTreeItem, UrlTreeItem, ICON } from './TreeItem';

export async function init(context: ExtensionContext) {
  const cwd = workspace.rootPath;

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
