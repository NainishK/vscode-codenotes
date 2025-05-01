import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface StickyNote {
    file: string;
    line: number;
    content: string;
    created: string;
    color?: string; // Optional color for the note
}

export class NotesProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<StickyNoteTreeItem | undefined | void> = new vscode.EventEmitter<StickyNoteTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<StickyNoteTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private filterQuery: string = '';

    constructor(private context: vscode.ExtensionContext) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    setFilterQuery(query: string) {
        this.filterQuery = query;
        this.refresh();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        const notes = this.getNotes();
        if (!element) {
            // Root: return FileTreeItem[]
            const files = Array.from(new Set(notes.map(n => n.file)));
            files.sort();
            return Promise.resolve(files.map(file => {
                const noteCount = notes.filter(n => n.file === file).length;
                return new FileTreeItem(file, noteCount);
            }));
        } else if (element instanceof FileTreeItem) {
            // Children: return StickyNoteTreeItem[] for this file
            const fileNotes = notes.filter(n => n.file === element.file);
            fileNotes.sort((a, b) => a.line - b.line);
            return Promise.resolve(fileNotes.map(note => new StickyNoteTreeItem(note)));
        } else {
            return Promise.resolve([]);
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
            let notes = JSON.parse(raw) as StickyNote[];
            if (this.filterQuery && this.filterQuery.trim() !== '') {
                const q = this.filterQuery.trim().toLowerCase();
                notes = notes.filter(note =>
                    note.content.toLowerCase().includes(q) ||
                    note.file.toLowerCase().includes(q) ||
                    (note.line + 1).toString() === q
                );
            }
            // Sort by filename, then by line number
            notes.sort((a, b) => {
                const fileCompare = a.file.localeCompare(b.file);
                if (fileCompare !== 0) return fileCompare;
                return a.line - b.line;
            });
            return notes;
        } catch {
            return [];
        }
    }
}

export class FileTreeItem extends vscode.TreeItem {
    constructor(public readonly file: string, noteCount: number) {
        super(path.basename(file), vscode.TreeItemCollapsibleState.Collapsed);
        this.tooltip = file;
        this.resourceUri = vscode.Uri.file(file);
        this.iconPath = new vscode.ThemeIcon('file');
        this.contextValue = 'file';
        this.id = file;
        this.description = `${noteCount} note${noteCount === 1 ? '' : 's'}`;
    }
}

export class StickyNoteTreeItem extends vscode.TreeItem {
    constructor(public readonly note: StickyNote) {
        super(note.content, vscode.TreeItemCollapsibleState.None);
        this.tooltip = `${note.content}\n${note.file}:${note.line + 1}`;
        this.description = `#${note.line + 1}`;
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
