'use strict';

import * as vscode from 'vscode';
import { NodeDependenciesProvider } from './NodeDependencies';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    const rootPath = vscode.workspace.rootPath;

    const nodeDependenciesProvider = new NodeDependenciesProvider(rootPath);

    vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);

    vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`));
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
}