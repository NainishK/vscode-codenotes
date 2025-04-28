import * as vscode from 'vscode';

export class NoteWebview {
    static show(panelTitle: string, onSave: (content: string) => void, onCancel?: () => void, initialContent: string = '') {
        const panel = vscode.window.createWebviewPanel(
            'stickyNoteWebview',
            panelTitle,
            vscode.ViewColumn.Active,
            { enableScripts: true }
        );

        panel.webview.html = NoteWebview.getHtml(initialContent);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'save') {
                onSave(message.content);
                panel.dispose();
            } else if (message.command === 'cancel') {
                if (onCancel) onCancel();
                panel.dispose();
            }
        });
    }

    static getHtml(initialContent: string): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Sticky Note</title>
                <style>
                    body { font-family: sans-serif; margin: 0; padding: 0; background: #fffbe7; }
                    .container { padding: 20px; }
                    textarea {
                        width: 100%;
                        min-height: 120px;
                        font-size: 1.1em;
                        background: #fffde4;
                        border: 1px solid #ffd600;
                        border-radius: 8px;
                        resize: vertical;
                        padding: 10px;
                        box-sizing: border-box;
                    }
                    .actions { margin-top: 16px; }
                    button {
                        background: #ffd600;
                        border: none;
                        border-radius: 4px;
                        padding: 8px 18px;
                        font-size: 1em;
                        margin-right: 10px;
                        cursor: pointer;
                    }
                    button.cancel { background: #eee; color: #444; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Sticky Note</h2>
                    <textarea id="noteContent" autofocus>${initialContent.replace(/</g, '&lt;')}</textarea>
                    <div class="actions">
                        <button onclick="saveNote()">Save</button>
                        <button class="cancel" onclick="cancelNote()">Cancel</button>
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    function saveNote() {
                        vscode.postMessage({ command: 'save', content: document.getElementById('noteContent').value });
                    }
                    function cancelNote() {
                        vscode.postMessage({ command: 'cancel' });
                    }
                </script>
            </body>
            </html>
        `;
    }
}
