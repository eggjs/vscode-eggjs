// 'use strict';

// import * as vscode from 'vscode';
// import * as path from 'path';
// import { fs } from 'mz';
// import * as globby from 'globby';
// import * as parser from 'mocha-codemod';
// import TreeProvider from './TreeProvider';

// import { TreeItem, FileTreeItem, UrlTreeItem, ICON } from './TreeItem';

// export function init(context: vscode.ExtensionContext) {
//   const { commands, workspace, window, Uri } = vscode;
//   const rootPath = workspace.rootPath;
//   const treeProvider = new EggTestProvider(path.join(rootPath, 'test'));
//   window.registerTreeDataProvider('eggTest', treeProvider);
//   commands.registerCommand('eggTest.refreshEntry', () => treeProvider.refresh());
// }

// class FileTreeProvider extends TreeProvider {
//   constructor(
//     protected baseDir: string
//   ) {
//     super(baseDir);
//   }

//   protected filterRules: Array<String> = [ 'node_modules' ];

//   async getRootNodes(): Promise<TreeItem[]> {
//     const files = await globby(['**/*.test.js', '!fixtures/**'], { cwd: this.baseDir });
//     return files.map(file => new TestTreeItem(file, path.join(this.baseDir, file)));
//   }
// }

// export class EggTestProvider extends FileTreeProvider {
//   constructor(protected baseDir: string) {
//     super(baseDir);
//     this.filterRules.push('fixtures')
//     vscode.workspace.findFiles
//   }
// }

// class TestTreeItem extends TreeItem {
//   constructor(
//     public readonly label: string,
//     public readonly filePath: string,
//   ) {
//     super(label, false);
//   }

//   async getChildren(): Promise<TreeItem[]> {
//     const source = await fs.readFile(this.filePath, 'utf-8');
//     const tree = parser({ source, filePath: this.filePath });
//     return new AstTreeItem(this.filePath, this.filePath, tree).getChildren();
//   }
// }

// const DescribeIcon = {
//   light: path.join(__dirname, '../../resources/light/test-dir.svg'),
//   dark: path.join(__dirname, '../../resources/dark/test-dir.svg'),
// };
// const ItIcon = {
//   light: path.join(__dirname, '../../resources/light/test-file.svg'),
//   dark: path.join(__dirname, '../../resources/dark/test-file.svg'),
// };

// class AstTreeItem extends TreeItem {
//   constructor(
//     public readonly label: string,
//     public readonly filePath: string,
//     public readonly item: any,
//   ) {
//     super(label, item.type !== 'describe', item.type !== 'describe' ? ItIcon : DescribeIcon);
//   }

//   async getChildren(): Promise<TreeItem[]> {
//     return this.item.children
//       .filter(item => item.type === 'describe' || item.type === 'it')
//       .map(item => {
//         let label;
//         if (item.type === 'it') {
//           label = item.title;
//         } else {
//           label = `${item.type}${item.title ? '(\'' + item.title + '\')' : '()'}`;
//         }
//         return new AstTreeItem(label, item.filePath, item);
//       });
//   }
// }
