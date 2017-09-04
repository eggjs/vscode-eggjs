const vscode = require('vscode'),
const fs = require('fs');
function loadProxyFacade() {
  fs.readdirSync('')
		.filter(fname => fname.endsWith('.js'))
		.forEach(fname =>
			templates[fname.replace('.js', '')] = fs.readFileSync(templatesFolder + fname, 'utf8'));
}
function initialize (context) {
  let subscriptions = context.subscriptions;
  subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider('chair-proxy-class', {
			provideTextDocumentContent: (uri) => {
				console.log(uri)
			}
		}));
}

module.exports = {
	initialize,
};