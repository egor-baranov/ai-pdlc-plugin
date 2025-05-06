import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  const chatProvider = new ChatViewProvider(context);

  context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
          "aiPdlcChatView",
          chatProvider,
          { webviewOptions: { retainContextWhenHidden: true } }
      )
  );

  // Register commands
  context.subscriptions.push(
      vscode.commands.registerCommand("aiPdlc.newSession", () => {
        chatProvider.postMessageToWebview({ type: "newSession" });
      }),
      vscode.commands.registerCommand("aiPdlc.viewHistory", () => {
        vscode.window.showInformationMessage("History not implemented.");
      }),
      vscode.commands.registerCommand("aiPdlc.clearConsole", () => {
        chatProvider.postMessageToWebview({ type: "clear" });
      })
  );
}

export function deactivate() {}

class ChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    console.log(`Out dir path: ${path.join(this.context.extensionPath, "web", "out")}`);

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(
            path.join(this.context.extensionPath, "web", "out")
        ),
      ],
    };

    webviewView.webview.html = this.getWebviewContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg) => {
      if (msg.type === "chatMessage") {
        vscode.window.showInformationMessage(`User says: ${msg.text}`);
      }
    });
  }

  postMessageToWebview(message: any) {
    this._view?.webview.postMessage(message);
  }

  private getWebviewContent(webview: vscode.Webview): string {
    const nonce = getNonce();

    // on-disk folder containing your exported Next.js files
    const outFolder = vscode.Uri.file(
        path.join(this.context.extensionPath, "web", "out")
    );

    // helper to turn a relative path under "out" into a Webview URI
    const getUri = (relativePath: string) =>
        webview.asWebviewUri(
            vscode.Uri.file(path.join(outFolder.fsPath, relativePath))
        );

    return /* html */ `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="
        default-src 'none';
        style-src ${webview.cspSource} 'unsafe-inline';
        script-src 'nonce-${nonce}';
        img-src ${webview.cspSource} data:;
      "
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- Next.js–exported CSS (if any) -->
    <link
      rel="stylesheet"
      href="${getUri("_next/static/css/styles.css")}"
    />
    <title>AI Chat</title>
  </head>
  <body>
    <div id="__next"></div>
    <!-- Runtime chunk -->
    <script nonce="${nonce}" src="${getUri("_next/static/chunks/runtime.js")}"></script>
    <!-- Main chunk -->
    <script nonce="${nonce}" src="${getUri("_next/static/chunks/main.js")}"></script>
    <!-- Page chunk (adjust name if your page chunk differs) -->
    <script nonce="${nonce}" src="${getUri("_next/static/chunks/pages/index.js")}"></script>
  </body>
</html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
