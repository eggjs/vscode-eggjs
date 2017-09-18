const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const util = require('../util');
module.exports = function (document, position, token) {
    let uri = document.uri.path;
    let currentWord = util.getWord(document, position);
    if (!currentWord) return;

    return new Promise((resolve, reject) => {
        commands.getModel().load(uri).filter((arg) => {
            return arg.loadStatus == 'ok'
        }).flatMap(() => {
            return commands.getModel().getDefinition(uri, position.line, position.character, currentWord)
        }).subscribe(function (arg) {
            resolve(arg)
        })
    }).then(function (result) {
        if (result && result.type == 'definition') {
            let points = _.split(_.split(result.msg, ":")[1], "-")
            let startPoint = _.split(points[0], ",")
            let endPoint = _.split(points[1], ",")
            let startLine = parseInt(_.replace(startPoint[0], "(", ""))
            let startCol = parseInt(_.replace(startPoint[1], ")", ""))
            let endLine = parseInt(_.replace(endPoint[0], "(", ""))
            let endCol = parseInt(_.replace(endPoint[1], ")", ""))

            let range = new vscode.Range(startLine - 1, startCol - 1, endLine - 1, endCol - 1)

            return new vscode.Location(document.uri, range)
        } else {
            return null
        }
    })
};
