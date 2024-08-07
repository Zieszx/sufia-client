import * as vscode from 'vscode';
import * as path from 'path';

// 

/**
 * Activates the extension.
 * @param context - The extension context.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "sufia" is now active!');

    // Register the commands
    const setUserDisposable = vscode.commands.registerCommand('sufia.setUser', async () => {
        const url = await vscode.window.showInputBox({
            prompt: 'Enter the URL to push',
            placeHolder: 'http://example.com'
        });

        if (!url) {
            vscode.window.showErrorMessage('URL input was cancelled or empty.');
            return;
        }

        const username = await vscode.window.showInputBox({
            prompt: 'Enter the username',
            placeHolder: 'username'
        });

        if (!username) {
            vscode.window.showErrorMessage('Username input was cancelled or empty.');
            return;
        }

        setUser(url, username);
    });

    const pullAllDisposable = vscode.commands.registerCommand('sufia.pullAll', async () => {
        const terminal = vscode.window.terminals.find(t => t.name === 'Sufia Terminal');
        const pullAllCommand = 'sufia pull --all';

        if (terminal) {
            terminal.sendText(pullAllCommand);
            terminal.show();
        } else {
            const newTerminal = vscode.window.createTerminal('Sufia Terminal');
            newTerminal.sendText(pullAllCommand);
            newTerminal.show();
        }
    });

    const pushCodeToServerDisposable = vscode.commands.registerCommand('sufia.pushCodetoSufia', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found!');
            return;
        }

        const document = editor.document;
        const content = document.getText();
        pushCodeToServer(content);
    });

    const pullCodeFromSufiaDisposable = vscode.commands.registerCommand('sufia.pullCodefromSufia', async () => {
        const groupCode = await vscode.window.showInputBox({
            prompt: 'Enter the group code',
            placeHolder: 'groupCode'
        });

        if (!groupCode) {
            vscode.window.showErrorMessage('Group code input was cancelled or empty.');
            return;
        }

        const transactionCode = await vscode.window.showInputBox({
            prompt: 'Enter the transaction code',
            placeHolder: 'transactionCode'
        });

        if (!transactionCode) {
            vscode.window.showErrorMessage('Transaction code input was cancelled or empty.');
            return;
        }

        pullCodeFromSufia(groupCode, transactionCode);
    });

    const pullExistingCodeDisposable = vscode.commands.registerCommand('sufia.pullExistingCodefromSufia', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }
        const filePath = editor.document.uri.fsPath;

        pullExistingCodefromSufia(filePath);
    });

    const pushNewVersionDisposable = vscode.commands.registerCommand('sufia.pushNewVersion', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found!');
            return;
        }

        const document = editor.document;
        const content = document.getText();
        pushNewVersion(content);
    });

    context.subscriptions.push(
        setUserDisposable,
        pullAllDisposable,
        pushCodeToServerDisposable,
        pullCodeFromSufiaDisposable,
        pullExistingCodeDisposable,
        pushNewVersionDisposable
    );

    // Register the tree data providers
    vscode.window.registerTreeDataProvider('sufiaCommands', new SufiaCommandsProvider());
}

async function setUser(urlString: string, username: string) {
    const registerCommand = `sufia set -host ${urlString} -user ${username} -password`;
    const terminal = vscode.window.createTerminal('Sufia Terminal');
    terminal.sendText(registerCommand);
    terminal.show();
}

async function pushCodeToServer(content: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }
    const filePath = editor.document.uri.fsPath;

    const transactionCode = path.basename(path.dirname(filePath));
    const groupCode = path.basename(path.dirname(path.dirname(filePath)));

    const versionPush = await vscode.window.showInputBox({
        prompt: 'Enter the version to push',
        placeHolder: 'Edit, if no new version is required, put "none"'
    });

    if(versionPush === "none"){
        const terminal = vscode.window.terminals.find(t => t.name === 'Sufia Terminal');
        if (terminal) {
            terminal.sendText(`sufia push -g ${groupCode} -c ${transactionCode}`);
            terminal.show();
        } else {
            const newTerminal = vscode.window.createTerminal('Sufia Terminal');
            newTerminal.sendText(`sufia push -g ${groupCode} -c ${transactionCode}`);
            newTerminal.show();
        }
    }else{
        const terminal = vscode.window.terminals.find(t => t.name === 'Sufia Terminal');
        if (terminal) {
            terminal.sendText(`sufia push -g ${groupCode} -c ${transactionCode} -v ${versionPush}`);
            terminal.show();
        } else {
            const newTerminal = vscode.window.createTerminal('Sufia Terminal');
            newTerminal.sendText(`sufia push -g ${groupCode} -c ${transactionCode} -v ${versionPush}`);
            newTerminal.show();
        }
    }
    vscode.window.showInformationMessage('Code pushed to server successfully');

}

function pullCodeFromSufia(groupCode: string, transactionCode: string) {
    const pullCommand = `sufia pull -g ${groupCode} -c ${transactionCode}`;

    const terminal = vscode.window.terminals.find(t => t.name === 'Sufia Terminal');
    if (terminal) {
        terminal.sendText(pullCommand);
        terminal.show();
    } else {
        const newTerminal = vscode.window.createTerminal('Sufia Terminal');
        newTerminal.sendText(pullCommand);
        newTerminal.show();
    }

    vscode.window.showInformationMessage('Code pulled from server successfully');
}

function pullExistingCodefromSufia(filePath: string) {
    const groupCode = path.basename(path.dirname(filePath));
    const transactionCode = path.basename(path.dirname(path.dirname(filePath)));

    const terminal = vscode.window.terminals.find(t => t.name === 'Sufia Terminal');
    if (terminal) {
        terminal.sendText(`sufia pull -g ${groupCode} -c ${transactionCode} --override`);
        terminal.show();
    } else {
        const newTerminal = vscode.window.createTerminal('Sufia Terminal');
        newTerminal.sendText(`sufia pull -g ${groupCode} -c ${transactionCode} --override`);
        newTerminal.show();
    }

    vscode.window.showInformationMessage('Code pulled from server successfully');
}

class SufiaCommandsProvider implements vscode.TreeDataProvider<SufiaCommandItem> {
    getTreeItem(element: SufiaCommandItem): vscode.TreeItem {
        return element;
    }

    getChildren(): SufiaCommandItem[] {
        return [
            new SufiaCommandItem('Set User', 'sufia.setUser', 'person-add'),
            new SufiaCommandItem('Pull All', 'sufia.pullAll', 'sync'),
            new SufiaCommandItem('Push Code to Sufia', 'sufia.pushCodetoSufia', 'cloud-upload'),
            new SufiaCommandItem('Pull Code from Sufia', 'sufia.pullCodefromSufia', 'cloud-download'),
            new SufiaCommandItem('Pull Existing Code from Sufia', 'sufia.pullExistingCodefromSufia', 'file-code'),
            new SufiaCommandItem('Push New Version', 'sufia.pushNewVersion', 'version')
        ];
    }
}

class SufiaCommandItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private commandId: string,
        iconName: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon(iconName);
        this.command = {
            command: this.commandId,
            title: this.label
        };
    }
}
async function pushNewVersion(content: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found!');
        return;
    }

    const document = editor.document;
    const filePath = document.uri.fsPath;

    const transactionCode = path.basename(path.dirname(filePath));
    const groupCode = path.basename(path.dirname(path.dirname(filePath)));

    const versionPush = await vscode.window.showInputBox({
        prompt: 'Enter the version to push',
        placeHolder: 'eg: Edit, Update, etc.'
    });

    if(!versionPush){
        vscode.window.showErrorMessage('Version input was cancelled or empty.');
        return;
    }

    const terminal = vscode.window.terminals.find(t => t.name === 'Sufia Terminal');
    if (terminal) {
        terminal.sendText(`sufia push -g ${groupCode} -c ${transactionCode} -v ${versionPush}`);
        terminal.show();
    } else {
        const newTerminal = vscode.window.createTerminal('Sufia Terminal');
        newTerminal.sendText(`sufia push -g ${groupCode} -c ${transactionCode} -v ${versionPush}`);
        newTerminal.show();
    }

    vscode.window.showInformationMessage('Code pushed to server successfully');
}


export function deactivate() {}

