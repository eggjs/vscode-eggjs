'use strict';

import * as vscode from 'vscode';
import { EggDependenciesProvider } from './EggDependencies';
import { EggConfigProvider } from './EggConfig';
import { Hints }  from './hints/index';
const DefinitionProvider = require('./hints/providers/definition');
Hints.init();
const DOCUMENT_SELECTOR = ['javascript'];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('extension actived');
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
     //======================================
	//          智能提示	
	//======================================	
	const completion = vscode.languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, {
		provideCompletionItems: (document, position) => {
            return Hints.hasComplecationItem(document, position); 
		},
		resolveCompletionItem: item => { 
            return item;
        }
    }, '.');
    const subscriptions = context.subscriptions;
    subscriptions.push(completion);
    // const definition = vscode.languages.registerDefinitionProvider(DOCUMENT_SELECTOR, new DefinitionProvider());
    // subscriptions.push(definition);
}

// this method is called when your extension is deactivated
export function deactivate() {
}