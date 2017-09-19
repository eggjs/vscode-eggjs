import { fs } from 'mz';
import * as vscode from 'vscode';
import * as path from 'path';
import * as globby from 'globby';
type CMap = { key: string, value: vscode.CompletionItem };
type Map = { key: string, value: string };
const classMethodMap = {} as Map;
const methodDefineMap = {} as Map;
const serviceMap = {};
const patt = new RegExp("\\* (\\w+)\\((.*)\\) \\{", "g");
const serviceReg = new RegExp("\\*?.*?(\\w+).*?\\((.*)\\) \\{", "g");
function readDir(dirPath, fileArr = []) {
    const stat = fs.statSync(dirPath);
    if (stat) { //判断文件、文件目录是否存在
        if (stat.isFile()) {
            fileArr.push(dirPath);
        } else if (stat.isDirectory()) {
            const files = fs.readdirSync(dirPath);
            if (files && files.length > 0) {
                files.forEach(function (file) {
                    readDir(path.join(dirPath, file), fileArr);
                });
            }
        }
    } else {
        console.info('根目录不存在.');
    }
}
class Hints  {
    private baseRoot: String;
    private serviceArr = [] as Array<string>;
    private proxyArr = []  as Array<string>;
    private proxyMethod = {} as Object;
    private serviceMap = {} as { key: string, value: object };
    private serviceCompletionItems = [] as Array<vscode.CompletionItem>;
    private proxyCompletionItems= [] as Array<vscode.CompletionItem>;
    private proxyMethodCompletionItems= {} as CMap;
    private serviceMethodCompletionItems= {} as CMap;
    constructor(baseRoot: String){
        this.baseRoot = baseRoot;
        this.init();
    }
    isChair(): boolean {
        return true;
    }
    async init() {
        // 文件目录读取
        if (vscode.workspace.rootPath) {
            // chair: facade文件
            await this.getFacade(vscode.workspace.rootPath + '/app/proxy/');
            // chair: service文件
            await this.getServices(vscode.workspace.rootPath + '/app/service/');
            this.generateServiceCompletionItems();
            this.getServiceMethodCompletionItems();
            this.generateProxyCompletionItems();
            this.generateProxyMethodCompletionItems();
        }
    }
    async getFacade(facadePath: string) {
        const result = await globby([ '*.js', '**/*.js' ], { cwd: facadePath});
        result.forEach(fname => {
            const className = fname.replace('.js', '');
            this.proxyMethod[className] = {};
            const content = fs.readFileSync(facadePath + fname, 'utf8');
            let result;
            while ((result = patt.exec(content)) != null) {
                const method = result[1];
                const params = result[2];
                this.proxyMethod[className][method] = {
                    params: params,
                    path: facadePath + fname,
                    line: 0,
                    start: 0,
                    end: 0,
                };
            }
        });
        return result;
    }
    async getServices(servicePath: string) {
        const result = await globby([ '*.js', '**/*.js' ], { cwd: servicePath});
        result.forEach(fname => {
            // wealth/community.js
            // gray.js
            // jubao_headline.js
            const className = fname.replace('.js', '').replace(/_[a-z]/g, function (str) {
                if (str.length === 2 && str[0] === '_') {
                    return str[1].toUpperCase();
                }
            }).replace(path.sep, '.');
            this.serviceMap[className] = {};
            const content = fs.readFileSync(servicePath + fname, 'utf8');
            let result;
            while ((result = serviceReg.exec(content)) != null) {
                const method = result[1];
                const params = result[2];
                this.serviceMap[className][method] = {
                    params: params,
                    path: servicePath + fname,
                    line: 0,
                    start: 0,
                    end: 0,
                };
            }
        });
        return result;
    }
    generateServiceCompletionItems(){
        const items = [];
        for (let className in this.serviceMap) {
            let item = new vscode.CompletionItem(className, vscode.CompletionItemKind.Class);
            item.insertText = className;
            item.sortText = '0';
            item.documentation = 'doc-comment.';
            items.push(item);
        }
        this.serviceCompletionItems = items;
    }
    generateProxyCompletionItems() {
        const items = [];
        for (let className in this.proxyMethod) {
            let item = new vscode.CompletionItem(className, vscode.CompletionItemKind.Class);
            item.insertText = className;
            item.sortText = '0';
            item.documentation = 'doc-comment.';
            items.push(item);
        }
        this.proxyCompletionItems = items;
    }
    generateProxyMethodCompletionItems() {
        const items = {} as CMap;
        for (let className in this.proxyMethod) {
            if (!items[className]) {
                items[className] = [];
            }
            for (let method in this.proxyMethod[className]) {
                const methodOb = this.proxyMethod[className][method];
                let item = new vscode.CompletionItem(method, vscode.CompletionItemKind.Property);
                item.insertText = method + '(' + methodOb.params + ');';
                item.documentation = 'doc-comment.';
                item.sortText = '0';
                items[className].push(item);
                methodDefineMap[className + '.' + method] = methodOb.path;
            }
        }
        this.proxyMethodCompletionItems = items;
    }
    getServiceMethodCompletionItems() {
        const items = {} as CMap;
        for (let className in this.serviceMap) {
            if (!items[className]) {
                items[className] = [];
            }
            for (let method in this.serviceMap[className]) {
                const methodOb = this.serviceMap[className][method];
                let item = new vscode.CompletionItem(method, vscode.CompletionItemKind.Property);
                item.insertText = method + '(' + methodOb.params + ');';
                item.documentation = 'doc-comment.';
                item.sortText = '0';
                items[className].push(item);
                methodDefineMap[className + '.' + method] = methodOb.path;
            }
        }
        this.serviceMethodCompletionItems= items;
    }
    getMethodDefineItems(): Map {
        return methodDefineMap;
    }
    getWordBeforePosition(document: vscode.TextDocument, position: vscode.Position): string {
        const lineTextBefore = this.getTextBeforePosition(document, position);
        return lineTextBefore;
    }
    getTextBeforePosition(document: vscode.TextDocument, position: vscode.Position): string {
        const lineText = document.lineAt(position).text;
        return lineText.substring(0, position.character - 1);
    }
    hasCompletionItem(document: vscode.TextDocument, position: vscode.Position): Array<vscode.CompletionItem> {
        const lineText = this.getTextBeforePosition(document, position);
        const serviceArr = this.serviceArr;
        const proxyArr = this.proxyArr;
        const proxyCompletionItems = this.proxyCompletionItems;
        const completionItems = this.proxyMethodCompletionItems;
        const serviceCompletionItems = this.serviceCompletionItems;
        const serviceMethodCompletionItems = this.serviceMethodCompletionItems;
        // this.proxy.
        if (lineText.endsWith('proxy')) {
            return proxyCompletionItems;
        }
        // this.service
        if (lineText.endsWith('service')) {
            return serviceCompletionItems;
        }
        // this.proxy.fundFacade
        for (let key in completionItems) {
            if (lineText.endsWith(key)) {
                return completionItems[key];
            }
        }
        // this.proxy.fundFacade
        for (let key in serviceMethodCompletionItems) {
            if (lineText.endsWith(key)) {
                return serviceMethodCompletionItems[key];
            }
        }
        return null;
    }
};
export default Hints;
