'use strict';

import * as vscode from 'vscode';
import * as utils from './utils';
import * as EggConfig from './EggConfig';
// import * as EggTest from './EggTest';
import * as EggSnippet from './EggSnippet';
import * as EggDebugger from './EggDebugger';
import { ExtensionContext, commands, workspace, window, Uri } from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
    console.log('vscode-eggjs is activate!');

    const cwd = workspace.rootPath;
    const config = workspace.getConfiguration('eggjs');

    const framework = await utils.getFramework(cwd);
    await context.workspaceState.update('eggjs.framework', framework);

    if (framework) {
        // load config sidebar only if at egg project
        await commands.executeCommand("setContext", "isEgg", true);
        EggConfig.init(context);
        EggDebugger.init(context);
    }

    EggSnippet.init(context);
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