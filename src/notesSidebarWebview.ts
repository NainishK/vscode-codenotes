import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class NotesSidebarWebview implements vscode.WebviewViewProvider {
    public static readonly viewType = 'codenotes.notesSidebar';
    private _view?: vscode.WebviewView;
    
    constructor(private readonly context: vscode.ExtensionContext) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
        };
        webviewView.webview.html = this.getHtmlForWebview();
        // Listen for messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            vscode.window.showInformationMessage('[SidebarWebview] Received message: ' + JSON.stringify(message));
            switch (message.command) {
                case 'getNotes': {
                    const notes = this.getNotes(message.filter);
                    vscode.window.showInformationMessage('[SidebarWebview] Sending notes: count=' + notes.length);
                    webviewView.webview.postMessage({ command: 'notes', notes });
                    break;
                }
                // Future: handle addNote, editNote, deleteNote
            }
        });
    }

    private getNotes(filter: string = ''): any[] {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return [];
        }
        const notesFile = path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'notes.json');
        if (!fs.existsSync(notesFile)) {
            return [];
        }
        try {
            const raw = fs.readFileSync(notesFile, 'utf8');
            let notes = JSON.parse(raw);
            if (filter && filter.trim() !== '') {
                const q = filter.trim().toLowerCase();
                notes = notes.filter((note: any) =>
                    note.content.toLowerCase().includes(q) ||
                    note.file.toLowerCase().includes(q) ||
                    (note.line + 1).toString() === q
                );
            }
            return notes;
        } catch {
            return [];
        }
    }

    private getHtmlForWebview(): string {
        // Basic HTML: search input, add button, notes list placeholder
        return [
            '<style>',
            '.sidebar-header { display: flex; align-items: center; gap: 8px; padding: 8px; }',
            '.sidebar-header input { flex: 1; padding: 4px 8px; }',
            '.sidebar-header button { font-size: 1.2em; padding: 2px 10px; }',
            '.notes-list { padding: 0 8px; }',
            '.note-item { border-bottom: 1px solid #eee; padding: 8px 0; }',
            '.note-file { font-size: 0.9em; color: #888; }',
            '</style>',
            '<div class="sidebar-header">',
            '  <input id="noteFilter" type="text" placeholder="Search notes..." />',
            '  <button id="addNoteBtn" title="Add Sticky Note">+</button>',
            '</div>',
            '<div class="notes-list" id="notesList">',
            '  <em>Loading notes...</em>',
            '</div>',
            '<script>',
            '  const vscode = acquireVsCodeApi();',
            '  let filter = "";',
            '  function fetchNotes() {',
            '    vscode.postMessage({ command: "getNotes", filter });',
            '  }',
            '  document.getElementById("noteFilter").addEventListener("input", function(e) {',
            '    filter = e.target.value;',
            '    fetchNotes();',
            '  });',
            '  document.getElementById("addNoteBtn").addEventListener("click", function() {',
            '    vscode.postMessage({ command: "addNote" });',
            '  });',
            '  window.addEventListener("message", function(event) {',
            '    const message = event.data;',
            '    if (message.command === "notes") {',
            '      const notesList = document.getElementById("notesList");',
            '      if (message.notes.length === 0) {',
            '        notesList.innerHTML = "<em>No notes found.</em>";',
            '      } else {',
            '        notesList.innerHTML = message.notes.map(function(note) {',
            '          return "<div class=\"note-item\">" +',
            '            "<div>" + note.content.split("\\n")[0] + "</div>" +',
            '            "<div class=\"note-file\">" + note.file + ":" + (note.line + 1) + "</div>" +',
            '          "</div>";',
            '        }).join("");',
            '      }',
            '    }',
            '  });',
            '  // Initial fetch',
            '  fetchNotes();',
            '</script>'
        ].join('\n');
    }
}
