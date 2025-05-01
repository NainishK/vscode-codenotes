import * as vscode from 'vscode';

export class NoteWebview {
    static show(panelTitle: string, onSave: (content: string, color?: string, name?: string) => void, onCancel?: () => void, initialContent: string = '', initialColor?: string, initialName?: string, onDelete?: () => void) {
        const panel = vscode.window.createWebviewPanel(
            'stickyNoteWebview',
            panelTitle,
            vscode.ViewColumn.Active,
            { enableScripts: true }
        );

        panel.webview.html = NoteWebview.getHtml(initialContent, initialColor, initialName);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'save') {
                onSave(message.content, message.color, message.name);
                panel.dispose();
            } else if (message.command === 'cancel') {
                if (onCancel) onCancel();
                panel.dispose();
            } else if (message.command === 'delete') {
                if (onDelete) onDelete();
                panel.dispose();
            }
        });
    }

    static getHtml(initialContent: string, initialColor?: string, initialName?: string): string {
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
                    .note-title-label { font-weight: bold; margin-bottom: 4px; display: block; }
                    .note-title-input { width: 100%; max-width: 340px; font-size: 1.05em; margin-bottom: 10px; padding: 4px; border-radius: 4px; border: 1px solid #ddd; box-sizing: border-box; }
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
                    button.delete { background: #ff5252; color: #fff; }
                    /* Color palette styles */
                    .color-picker {
                        margin-top: 10px;
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                    .color-option {
                        border-radius: 50%;
                        transition: border 0.2s;
                    }
                    .color-option.selected, .color-option:focus {
                        border: 2px solid black !important;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <label class="note-title-label" for="noteTitle">Title (optional):</label>
                    <input id="noteTitle" class="note-title-input" type="text" maxlength="80" placeholder="Note title (optional)" value="${initialName ? initialName.replace(/"/g, '&quot;') : ''}">
                    <textarea id="noteContent" autofocus>${initialContent.replace(/</g, '&lt;')}</textarea>
                    <div class="color-picker" id="colorPicker"></div>
                    <div class="actions">
                        <button id="saveBtn">Save</button>
                        <button id="cancelBtn" class="cancel">Cancel</button>
                        <button id="deleteBtn" class="delete">Delete</button>
                    </div>
                    <div id="deleteModal" style="display:none; position:fixed; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.28); z-index:1000; align-items:center; justify-content:center;">
                        <div style="background:#fff; padding:24px 32px; border-radius:8px; box-shadow:0 4px 24px rgba(0,0,0,0.18); max-width:90vw; min-width:280px; text-align:center; margin:120px auto;">
                            <div style="font-size:1.15em; margin-bottom:20px;">Are you sure you want to delete this sticky note?</div>
                            <button class="delete" onclick="confirmDelete()">Delete</button>
                            <button class="cancel" onclick="hideDeleteModal()">Cancel</button>
                        </div>
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    let selectedColor = "${initialColor || '#FFD600'}";
                    const palette = [
                        '#FFD600', // Yellow
                        '#FFCDD2', // Light Red
                        '#B2FF59', // Light Green
                        '#B3E5FC', // Light Blue
                        '#E1BEE7', // Light Purple
                        '#FFF9C4', // Light Yellow
                        '#FFECB3', // Light Amber
                        '#FFFFFF', // White
                        'custom'   // Custom color option
                    ];
                    function renderPalette() {
                        const picker = document.getElementById('colorPicker');
                        picker.innerHTML = '';
                        palette.forEach(color => {
                            if (color === 'custom') {
                                const customDiv = document.createElement('div');
                                customDiv.className = 'color-option';
                                customDiv.style.background = selectedColor && !palette.includes(selectedColor) ? selectedColor : '#fff';
                                customDiv.style.border = '1px dashed #888';
                                customDiv.style.width = '28px';
                                customDiv.style.height = '28px';
                                customDiv.style.display = 'inline-block';
                                customDiv.style.margin = '5px';
                                customDiv.style.cursor = 'pointer';
                                customDiv.title = 'Pick custom color';
                                customDiv.innerHTML = '<span style="font-size:1.2em;position:relative;top:3px;left:7px;">+</span>';
                                customDiv.onclick = () => {
                                    const input = document.createElement('input');
                                    input.type = 'color';
                                    input.value = selectedColor && !palette.includes(selectedColor) ? selectedColor : '#FFD600';
                                    input.style.display = 'none';
                                    input.addEventListener('input', (e) => {
                                        selectedColor = input.value;
                                        renderPalette();
                                    });
                                    input.addEventListener('change', () => {
                                        document.body.removeChild(input);
                                    });
                                    input.addEventListener('blur', () => {
                                        if (document.body.contains(input)) document.body.removeChild(input);
                                    });
                                    document.body.appendChild(input);
                                    input.click();
                                };
                                picker.appendChild(customDiv);
                            } else {
                                const div = document.createElement('div');
                                div.className = 'color-option';
                                div.style.background = color;
                                div.style.border = color === selectedColor ? '2px solid #333' : '1px solid #ccc';
                                div.style.width = '28px';
                                div.style.height = '28px';
                                div.style.display = 'inline-block';
                                div.style.margin = '5px';
                                div.style.cursor = 'pointer';
                                div.onclick = () => {
                                    selectedColor = color;
                                    renderPalette();
                                };
                                picker.appendChild(div);
                            }
                        });
                    }
                    renderPalette();
                    document.getElementById('saveBtn').onclick = () => {
                        const content = (document.getElementById('noteContent')).value;
                        const name = (document.getElementById('noteTitle')).value.trim();
                        vscode.postMessage({ command: 'save', content, color: selectedColor, name });
                    };
                    document.getElementById('cancelBtn').onclick = () => {
                        vscode.postMessage({ command: 'cancel' });
                    };
                    document.getElementById('deleteBtn').onclick = () => {
                        document.getElementById('deleteModal').style.display = 'flex';
                    };
                    function hideDeleteModal() {
                        document.getElementById('deleteModal').style.display = 'none';
                    }
                    function confirmDelete() {
                        vscode.postMessage({ command: 'delete' });
                        hideDeleteModal();
                    }
                </script>
            </body>
            </html>
        `;
    }
}
