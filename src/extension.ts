'use strict';

import * as vscode from 'vscode';
import * as utils from './utils';
import * as EggConfig from './EggConfig';
// import * as EggTest from './EggTest';
import * as EggSnippet from './EggSnippet';
import * as EggDebugger from './EggDebugger';
import { ExtensionContext, commands, workspace, window, Uri } from 'vscode';
import * as globby from 'globby';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
    console.log('vscode-eggjs is activate!');

    const cwd = workspace.rootPath;
    const config = workspace.getConfiguration('eggjs');

    if (!cwd) return;

    const framework = await utils.getFramework(cwd);

    if (framework) {
        // load config sidebar only if at egg project
        await context.workspaceState.update('eggjs.framework', framework);
        await commands.executeCommand("setContext", "isEgg", true);
        await EggConfig.init(context);
        await EggDebugger.init(context);
    }

    await EggSnippet.init(context);
    // EggTest.init(context);

    commands.registerCommand('extension.openFile', async filePath => {
        const doc = await workspace.openTextDocument(Uri.file(filePath));
        await window.showTextDocument(doc);
        if (window.activeTextEditor) {
            await commands.executeCommand('workbench.files.action.collapseExplorerFolders');
            await commands.executeCommand('workbench.files.action.showActiveFileInExplorer')
            await commands.executeCommand('workbench.action.focusActiveEditorGroup');
        }
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
}