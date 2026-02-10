import * as vscode from 'vscode';
import { convertExcelToSql } from './converToSql';
import { handleSqlResult } from './actions';

export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand(
		'excelToSql.convert',
		async () => {

			const editor = vscode.window.activeTextEditor;
			if (!editor) {return;}

			const selection = editor.selection;
			const text = editor.document.getText(selection);

			if (!text.trim()) {
				vscode.window.showWarningMessage('No text selected');
				return;
			}

			const result = convertExcelToSql(text);
			await handleSqlResult(editor, selection, result);

		}
	);

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
