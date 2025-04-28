import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class StickyNoteCodeLensProvider implements vscode.CodeLensProvider {
    private notes: any[] = [];
    private notesFile: string | undefined;

    constructor(notesFile: string | undefined) {
        this.notesFile = notesFile;
        this.loadNotes();
    }

    setNotesFile(notesFile: string | undefined) {
        this.notesFile = notesFile;
        this.loadNotes();
    }

    loadNotes() {
        this.notes = [];
        if (this.notesFile && fs.existsSync(this.notesFile)) {
            try {
                const raw = fs.readFileSync(this.notesFile, 'utf8');
                this.notes = JSON.parse(raw);
            } catch {
                this.notes = [];
            }
        }
    }

    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] {
        this.loadNotes();
        const codeLenses: vscode.CodeLens[] = [];
        const filePath = document.uri.fsPath;
        this.notes.forEach(note => {
            if (note.file === filePath && note.line < document.lineCount) {
                const range = new vscode.Range(note.line, 0, note.line, 0);
                codeLenses.push(new vscode.CodeLens(range, {
                    title: 'Open Sticky Note',
                    command: 'codenotes.openStickyNote',
                    arguments: [note]
                }));
            }
        });
        return codeLenses;
    }
}
