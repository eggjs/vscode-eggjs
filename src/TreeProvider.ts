'use strict';

import { TreeDataProvider, EventEmitter, Event } from 'vscode';
import { TreeItem, FileTreeItem, UrlTreeItem, ICON } from './TreeItem';

export default abstract class TreeProvider implements TreeDataProvider<TreeItem> {

  private emitter: EventEmitter<TreeItem> = new EventEmitter<TreeItem>();
  readonly onDidChangeTreeData: Event<TreeItem> = this.emitter.event;

  protected rootNodes: TreeItem[];

  constructor(protected baseDir: string) {}

  refresh(data?: TreeItem): void {
    this.emitter.fire(data);
  }

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  abstract async getRootNodes(): Promise<TreeItem[]>

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (element) {
      return element.getChildren();
    } else {
      this.rootNodes = await this.getRootNodes();
      return this.rootNodes;
    }
  }
}
