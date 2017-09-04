const vscode = require('vscode');
const path = require('path');
const util = require('util');
import { Hints } from '../index';
const methodDefineMap = Hints.getMethodDefineItems();
class DefinitionProvider{
  constructor() {

  }
  provideDefinition(document, position, cancelToken) {
    const line = document.lineAt(position.line);
    if (line.isEmpty) {
      return null;
    }
    const word = document.getText(document.getWordRangeAtPosition(position));
    const reg = new RegExp(`proxy\\.(.*${word})`);
    const match = line.text.match(reg);
    if (!match || !methodDefineMap[match[1]]) {
      return null;
    }
    const item = methodDefineMap[match[1]];
    const location = new vscode.Location(vscode.Uri.file(item), position);
    return location;
  }
}

module.exports = DefinitionProvider;