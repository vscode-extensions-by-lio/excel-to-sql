import * as vscode from 'vscode';

export async function handleSqlResult(
  editor: vscode.TextEditor,
  selection: vscode.Selection,
  sql: string
) {
  const action = await vscode.window.showQuickPick(
    [
      { label: 'Replace selection' },
      { label: 'Open new file' },
      { label: 'Copy to clipboard' }
    ],
    { placeHolder: 'What do you want to do with the generated SQL?' }
  );

  if (!action) {return;};

  if (action.label === 'Replace selection') {
    editor.edit(builder => {
      builder.replace(selection, sql);
    });
  }

  if (action.label === 'Open new file') {
    const doc = await vscode.workspace.openTextDocument({
      language: 'sql',
      content: '\n' + sql
    });
    await vscode.window.showTextDocument(doc);
  }

  if (action.label === 'Copy to clipboard') {
    await vscode.env.clipboard.writeText(sql);
    vscode.window.showInformationMessage('SQL copied to clipboard');
  }
}
