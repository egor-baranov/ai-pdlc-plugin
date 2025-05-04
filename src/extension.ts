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

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this.context.extensionPath, "media")),
      ],
    };

    webviewView.webview.html = this.getChatHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg) => {
      if (msg.type === "chatMessage") {
        vscode.window.showInformationMessage(`User says: ${msg.text}`);
      }
    });
  }

  postMessageToWebview(message: any) {
    this._view?.webview.postMessage(message);
  }
  
  private getChatHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
  
    return /* html */ `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
    <style>
      body {
        font-family: var(--vscode-font-family, sans-serif);
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        height: 100vh;
        background-color: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
      }
      #chat {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        display: flex;
        flex-direction: column;
      }
      .bubble {
        margin: 5px;
        padding: 10px;
        border-radius: 8px;
        max-width: 80%;
        word-wrap: break-word;
      }
      .user {
        align-self: flex-end;
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
      }
      .bot {
        align-self: flex-start;
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
      }
      #input-area {
        display: flex;
        align-items: center;
        position: relative;
        padding: 8px;
        border-top: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-sideBar-background);
      }
      #input {
        flex: 1;
        padding: 6px 10px;
        font-size: 14px;
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
        outline: none;
      }
      #input:focus {
        border-color: var(--vscode-focusBorder);
      }
      #sendBtn {
        position: absolute;
        right: 12px;
        width: 22px;
        height: 22px;
        border-radius: 16%;
        border: none;
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
      }
      #sendBtn:hover {
        background-color: var(--vscode-button-hoverBackground);
      }
    </style>
  </head>
  <body>
    <div id="chat"></div>
    <div id="input-area">
      <input id="input" type="text" placeholder="Ask GigaStudio to build..." />
      <button id="sendBtn" class="send-button" title="Send">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path d="M2 21l20-9L2 3v7l15 2-15 2v7z" fill="currentColor"/>
        </svg>
      </button>
    </div>
    
    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
  
      const chat = document.getElementById('chat');
      const input = document.getElementById('input');
      const sendBtn = document.getElementById('sendBtn');
  
      sendBtn.addEventListener('click', send);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') send();
      });
  
      window.addEventListener('message', event => {
        const message = event.data;
        if (message.type === 'newSession' || message.type === 'clear') {
          chat.innerHTML = '';
        }
      });
  
      function send() {
        const text = input.value.trim();
        if (!text) return;
        appendMessage('user', text);
        vscode.postMessage({ type: 'chatMessage', text });
        input.value = '';
        setTimeout(() => {
          appendMessage('bot', generateFakeReply(text));
        }, 500);
      }
  
      function appendMessage(sender, text) {
        const div = document.createElement('div');
        div.className = 'bubble ' + sender;
        div.textContent = text;
        chat.appendChild(div);
        chat.scrollTop = chat.scrollHeight;
      }
  
      function generateFakeReply(text) {
        return \`Generating...\`;
      }
    </script>
  </body>
  </html>`;
  }
  
}

function getNonce() {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
