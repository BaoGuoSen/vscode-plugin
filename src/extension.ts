// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import completion from './completion';

// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
 completion(context);
}

// this method is called when your extension is deactivated
export function deactivate() {
 // clearInterval(timeout);
}
