import * as fs from 'fs';
import * as vscode from 'vscode';
type CMap = { key: string, value: vscode.CompletionItem };
type Map = { key: string, value: string};
const classMethodMap = {} as Map;
const methodDefineMap = {} as Map;
const serviceMap = {};
var patt = new RegExp("\\* (\\w+)\\((.*)\\) \\{","g");
var serviceReg = new RegExp("\\*?.*?(\\w+).*?\\((.*)\\) \\{","g");

exports.Hints = {
  isChair(): boolean{
    return true;
  },
  init(): void{
    // 文件目录读取
    if (vscode.workspace.rootPath) {
      // chair默认facade文件
      this.getFacade(vscode.workspace.rootPath + '/app/proxy/');
      // chair默认service文件
      this.getServices(vscode.workspace.rootPath + '/app/service/');
    }
  },
  getFacade(facadePath: string) {
    fs.readdirSync(facadePath)
      .filter(fname => fname.endsWith('.js'))
      .forEach(fname => {
        const className = fname.replace('.js', '');
        classMethodMap[className] = {};
        const content = fs.readFileSync(facadePath + fname, 'utf8');
        let result;
        while ((result = patt.exec(content)) != null)  {
          const method = result[1];
          const params = result[2];
          classMethodMap[className][method] = {
            params: params,
            path: facadePath + fname,
            line: 0,
            start: 0,
            end: 0,
          };
        }
      });
  },
  getServices(servicePath: string) {
    fs.readdirSync(servicePath)
      .filter(fname => fname.endsWith('.js'))
      .forEach(fname => {
        const className = fname.replace('.js', '').replace(/_[a-z]/g, function(str){
          if (str.length === 2 && str[0] === '_') {
            return str[1].toUpperCase();
          }
        });
        serviceMap[className] = {};
        const content = fs.readFileSync(servicePath + fname, 'utf8');
        let result;
        while ((result = serviceReg.exec(content)) != null)  {
          const method = result[1];
          const params = result[2];
          serviceMap[className][method] = {
            params: params,
            path: servicePath + fname,
            line: 0,
            start: 0,
            end: 0,
          };
        }
        
    });
  },
  getMethods():object {
    return methodDefineMap;
  },
  getServiceCompletionItems(): Array<vscode.CompletionItem>{
    const items = [];
    for (let className in serviceMap) {
      let item = new vscode.CompletionItem(className, vscode.CompletionItemKind.Class);
      item.insertText = className;
      item.sortText = '0';
      item.documentation = 'doc-comment.';
      items.push(item);
    }
    return items;
  },
  getProxyCompletionItems(): Array<vscode.CompletionItem>{
    const items = [];
    for (let className in classMethodMap) {
      let item = new vscode.CompletionItem(className, vscode.CompletionItemKind.Class);
      item.insertText = className;
      item.sortText = '0';
      item.documentation = 'doc-comment.';
      items.push(item);
    }
    return items;
  },
  getProxyArr(): Array<string>{
    const items = [];
    for (let className in classMethodMap) {
      items.push(className);
    }
    return items;
  },
  getServiceArr(): Array<string>{
    const items = [];
    for (let className in serviceMap) {
      items.push(className);
    }
    return items;
  },
  getProxyMethodCompletionItems(): CMap{
    const items = {} as CMap;
    for (let className in classMethodMap) {
      if (!items[className]) {
        items[className] = [];
      }
      for (let method in classMethodMap[className]) {
        const methodOb = classMethodMap[className][method];
        let item = new vscode.CompletionItem(method, vscode.CompletionItemKind.Property);
        item.insertText = method + '(' + methodOb.params + ');';
        item.documentation = 'doc-comment.';
        item.sortText = '0';
        items[className].push(item);
        methodDefineMap[className + '.' + method] = methodOb.path;
      }
    }
    return items;
  },
  getServiceMethodCompletionItems(): CMap{
    const items = {} as CMap;
    for (let className in serviceMap) {
      if (!items[className]) {
        items[className] = [];
      }
      for (let method in serviceMap[className]) {
        const methodOb = serviceMap[className][method];
        let item = new vscode.CompletionItem(method, vscode.CompletionItemKind.Property);
        item.insertText = method + '(' + methodOb.params + ');';
        item.documentation = 'doc-comment.';
        item.sortText = '0';
        items[className].push(item);
        methodDefineMap[className + '.' + method] = methodOb.path;
      }
    }
    return items;
  },
  getMethodDefineItems(): Map{
    return methodDefineMap;
  },
  isProxyFacade(document: vscode.TextDocument, position: vscode.Position): boolean {
    const lineText = document.lineAt(position).text;
    const pos = position.character;
  
    // 检查是不是 proxy.
    return lineText.substring(pos - 6, pos) === 'proxy.';
  },
  isProxyFacadeMethod(document: vscode.TextDocument, position: vscode.Position, facades: Array<string>): string|null {
    const lineText = document.lineAt(position).text;
    const word = this.getWordBeforePosition(document, position);
    // 检查是不是 proxy.
    if (facades.indexOf(word) > -1) {
      return word;
    }
    return null;
  },
  getWordBeforePosition(document: vscode.TextDocument, position: vscode.Position):string {
    const lineTextBefore = this.getTextBeforePosition(document, position);
    const lastPos = lineTextBefore.lastIndexOf('.');
    const word = lineTextBefore.substring(lastPos + 1, position.character - 1);
    return word;
  },
  getTextBeforePosition(document: vscode.TextDocument, position: vscode.Position): string {
    const lineText = document.lineAt(position).text;
    return lineText.substring(0, position.character - 1);
  },
  hasComplecationItem(document: vscode.TextDocument, position: vscode.Position): null | vscode.CompletionItem {
    const word = this.getWordBeforePosition(document, position);
    const serviceArr = this.getServiceArr();
    const proxyArr = this.getProxyArr();
    const proxyCompletionItems = this.getProxyCompletionItems();
    const completionItems = this.getProxyMethodCompletionItems();
    const serviceCompletionItems = this.getServiceCompletionItems();
    const serviceMethodCompletionItems = this.getServiceMethodCompletionItems();
    // this.proxy.
    if (word === 'proxy') {
        return proxyCompletionItems;
    }
    if (proxyArr.indexOf(word) > -1 && completionItems[word]) {
        return completionItems[word];
    }
    // this.service
    if (word === 'service') {
        return serviceCompletionItems;
    }
    if (serviceArr.indexOf(word) > -1 && serviceMethodCompletionItems[word]) {
        return serviceMethodCompletionItems[word];
    }
    return null;
  }
};
