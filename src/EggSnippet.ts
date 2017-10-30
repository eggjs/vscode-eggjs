'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { fs } from 'mz';
import { stripIndent } from 'common-tags';
import { getFrameworkOrEggPath } from 'egg-utils';
import { CompletionItem, CompletionItemKind, ExtensionContext, workspace } from 'vscode';

export function init(context: ExtensionContext) {
  const cwd = vscode.workspace.rootPath;
  const config = workspace.getConfiguration('eggjs.snippet');

  // get framework name
  const framework = context.workspaceState.get('eggjs.framework');

  const fnStyle = config.preferAsync ? 'async' : '*';

  // preset of snippets
  const snippets = {
    service: `
      'use strict';

      const Service = require('${framework}').Service;

      class \${TM_FILE_CLASS}Service extends Service {
        ${fnStyle} \${1:echo}() {
          $0
        }
      }

      module.exports = \${TM_FILE_CLASS}Service;
    `,

    controller: `
      'use strict';

      const Controller = require('${framework}').Controller;

      class \${TM_FILE_CLASS}Controller extends Controller {
        ${fnStyle} \${1:echo}() {
          $0
        }
      }

      module.exports = \${TM_FILE_CLASS}Controller;
    `
  }

  // register snippet
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider([ 'javascript' ], {
    provideCompletionItems() {
      return Object.keys(snippets).map(key => new SnippetCompletionItem(`egg ${key}`, stripIndent`${snippets[key]}` + '\n'));
    }
  }));
}

export class SnippetCompletionItem extends CompletionItem {
  constructor(label: string, snippet: string, locals?: object) {
    super(label, CompletionItemKind.Snippet);
    this.insertText = new SnippetString(snippet, locals);
  }
}

export class SnippetString extends vscode.SnippetString {
  constructor(value: string, locals: object = {}) {
    // preset variable
    locals = Object.assign({}, {
      TM_FILE_CLASS: 'TM_FILENAME_BASE/(.*)/${1:/capitalize}/',
    }, locals);

    // replace
    let snippet = value;
    for (const key of Object.keys(locals)) {
      snippet = snippet.replace(new RegExp(key, 'g'), locals[key]);
    }
    super(snippet);
  }
}