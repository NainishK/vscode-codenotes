import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface StickyNote {
    file: string;
    line: number;
    content: string;
    created: string;
}

export class NotesProvider implements vscode.TreeDataProvider<StickyNoteTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<StickyNoteTreeItem | undefined | void> = new vscode.EventEmitter<StickyNoteTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<StickyNoteTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: StickyNoteTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: StickyNoteTreeItem): Thenable<StickyNoteTreeItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            const notes = this.getNotes();
            return Promise.resolve(notes.map(note => new StickyNoteTreeItem(note)));
        }
    }

    getNotes(): StickyNote[] {
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
            return JSON.parse(raw) as StickyNote[];
        } catch {
            return [];
        }
    }
}

export class StickyNoteTreeItem extends vscode.TreeItem {
    constructor(public readonly note: StickyNote) {
        super(`${path.basename(note.file)}:${note.line + 1} - ${note.content}`, vscode.TreeItemCollapsibleState.None);
        this.tooltip = `${note.content}\n${note.file}:${note.line + 1}`;
        this.description = note.content;
        this.command = {
            command: 'codenotes.revealNote',
            title: 'Reveal Note',
            arguments: [note]
        };
        this.iconPath = new vscode.ThemeIcon('note');
        this.contextValue = 'stickyNote';
        this.id = note.file + ':' + note.line + ':' + note.created;
        this.resourceUri = vscode.Uri.file(note.file);
    }
}
