'use strict';

import * as vscode from 'vscode';
import { EggDependenciesProvider } from './EggDependencies';
import { EggConfigProvider } from './EggConfig';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const { commands, workspace, window, Uri } = vscode;

    const rootPath = vscode.workspace.rootPath;

    const eggDependenciesProvider = new EggDependenciesProvider(rootPath);
    window.registerTreeDataProvider('eggDependencies', eggDependenciesProvider);
    commands.registerCommand('eggDependencies.refreshEntry', () => eggDependenciesProvider.refresh());

    const eggConfigProvider = new EggConfigProvider(rootPath);
    window.registerTreeDataProvider('eggConfig', eggConfigProvider);
    commands.registerCommand('eggConfig.refreshEntry', () => eggConfigProvider.refresh());

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