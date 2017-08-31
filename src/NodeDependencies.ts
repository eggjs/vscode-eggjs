'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as globby from 'globby';

export class NodeDependenciesProvider implements vscode.TreeDataProvider<Node> {

  private _onDidChangeTreeData: vscode.EventEmitter<Node | undefined> = new vscode.EventEmitter<Node | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Node | undefined> = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {

  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Node): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Node): Thenable<Node[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace');
      return Promise.resolve([]);
    }

    return new Promise(resolve => {
      console.log(element)
      // return resolve(this.getRootNode());
      if (element) {
        resolve(element.getChildren());
      } else {
        resolve(this.getRootNode());
      }
    });
  }

  private getRootNode(): Node[] {
    const config = {
      egg: 'egg-*'
    };
    const rootNodes = [ new RootNode('All', '*') ];

    Object.keys(config).map(key => {
      const dep = new RootNode(key, config[key]);
      rootNodes.push(dep);
    });
    return rootNodes;
  }

	/**
	 * Given the path to package.json, read all its dependencies and devDependencies.
	 */
  // private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
  //   if (this.pathExists(packageJsonPath)) {
  //     const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  //     const toDep = (moduleName: string): Dependency => {
  //       if (this.pathExists(path.join(this.workspaceRoot, 'node_modules', moduleName))) {
  //         return new Dependency(moduleName, vscode.TreeItemCollapsibleState.Collapsed);
  //       } else {
  //         return new Dependency(moduleName, vscode.TreeItemCollapsibleState.None);
  //       }
  //     }

  //     const deps = packageJson.dependencies
  //       ? Object.keys(packageJson.dependencies).map(toDep)
  //       : [];
  //     const devDeps = packageJson.devDependencies
  //       ? Object.keys(packageJson.devDependencies).map(toDep)
  //       : [];
  //     return deps.concat(devDeps);
  //   } else {
  //     return [];
  //   }
  // }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }

    return true;
  }
}

enum NodeType {
  NODE = 'dependency',
  ROOT = 'dependency_root',
  README = 'dependency_readme',
  PACKAGE = 'dependency_package',
  GITHUB = 'dependency_github',
}

abstract class Node extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: string = NodeType.NODE,
    public readonly leaf: boolean = false,
  ) {
    super(label, leaf ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = type;
  }

  abstract async getChildren(): Promise<Node[]>;
}

class RootNode extends Node {
  constructor(
    public readonly label: string,
    public readonly match: string,
  ) {
    super(label, NodeType.ROOT, false);
  }

  async getChildren(): Promise<Node[]> {
    // const deps = lookup.filter(this.match);
    // console.log(deps);
    // const tree = await resolveDeps(vscode.workspace.rootPath);
    // console.log('xxx', tree);
    const result = globby.sync('**/node_modules/*/package.json', { cwd: vscode.workspace.rootPath });
    console.log(result);
    return [];
  }
}

class DependencyNode extends Node {
  constructor(
    public readonly label: string,
    public readonly pkgInfo: Object,
  ) {
    super(label, NodeType.NODE, false);
  }

  async getChildren(): Promise<Node[]> {
    // const deps = lookup.filter(this.match);
    // console.log(deps);
    return [];
  }

  // iconPath = {
  //   light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'dependency.svg'),
  //   dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'dependency.svg')
  // };

  // contextValue = 'dependency';
}
