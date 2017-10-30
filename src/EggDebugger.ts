'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { fs } from 'mz';
import { stripIndent } from 'common-tags';
import { getFrameworkOrEggPath } from 'egg-utils';
import { ExtensionContext, WorkspaceFolder, CancellationToken, DebugConfiguration, debug, workspace } from 'vscode';

export function init(context: ExtensionContext) {
  const cwd = vscode.workspace.rootPath;

  // register snippet
  context.subscriptions.push(debug.registerDebugConfigurationProvider('Egg', {
    provideDebugConfigurations(folder: WorkspaceFolder, token?: CancellationToken): DebugConfiguration[] {
      return [
        {
          "type": "node",
          "request": "launch",
          "name": "Egg Debug",
          "runtimeExecutable": "npm",
          "runtimeArgs": ["run", "debug"],
          "console": "integratedTerminal",
          "restart": true,
          "protocol": "auto",
          "port": 9999
        },
        {
          "type": "node",
          "request": "launch",
          "name": "Egg Debug with brk",
          "runtimeExecutable": "npm",
          "runtimeArgs": ["run", "debug", "--", "--inspect-brk"],
          "protocol": "inspector",
          "port": 9229
        },
        {
          "type": "node",
          "request": "launch",
          "name": "Egg Test",
          "runtimeExecutable": "npm",
          "runtimeArgs": ["run", "test-local", "--", "--inspect-brk"],
          "protocol": "auto",
          "port": 9229
        }
      ];
    },
  }));

  const agentConfig: DebugConfiguration = {
    "type": "node",
    "request": "attach",
    "name": "Egg Agent",
    "restart": true,
    "protocol": "inspector",
    "port": 5800
  };

  const workerConfig: DebugConfiguration = {
    "type": "node",
    "request": "attach",
    "name": "Egg Worker",
    "restart": true,
    "protocol": "inspector",
    "port": 9999
  };


  // debug.onDidStartDebugSession(e => {
  //   console.log('onDidStartDebugSession: %s, %j', e.name, e);
  //   if (e.name === 'Egg Debug with brk') {
  //     const folder = workspace.workspaceFolders[0];
  //     debug.startDebugging(folder, agentConfig).then(() => debug.startDebugging(folder, workerConfig));
  //   }
  // });
}
