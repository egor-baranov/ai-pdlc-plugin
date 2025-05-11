import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
    const chatProvider = new ChatViewProvider(context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            "aiPdlcChatView",
            chatProvider,
            {webviewOptions: {retainContextWhenHidden: true}}
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("aiPdlc.newSession", () => {
            chatProvider.postMessageToWebview({type: "newSession"});
        }),
        vscode.commands.registerCommand("aiPdlc.chatList", () => {
            chatProvider.postMessageToWebview({type: "chatList"});
        }),
        vscode.commands.registerCommand("aiPdlc.openSettings", () => {
            chatProvider.postMessageToWebview({type: "settings"});
        })
    );
}

class ChatViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private readonly context: vscode.ExtensionContext) {
    }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;
        const outDir = path.join(this.context.extensionPath, "web", "dist");

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(outDir)],
        };

        const scriptUri = webviewView.webview.asWebviewUri(
            vscode.Uri.file(path.join(outDir, "index.js"))
        );
        const cssUri = webviewView.webview.asWebviewUri(
            vscode.Uri.file(path.join(outDir, "index.css"))
        );

        webviewView.webview.html = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <link rel="stylesheet" href="${cssUri}" /><title>GigaStudio</title>
          </head>
          <body>
            <div id="root"></div>
            <script src="${scriptUri}"></script>
          </body>
        </html>
        `;
    }

    public postMessageToWebview(message: any) {
        this._view?.webview.postMessage(message);
    }
}
