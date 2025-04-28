// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { NotesProvider, StickyNote } from './notesProvider';
import { NoteWebview } from './noteWebview';
import { StickyNoteCodeLensProvider } from './stickyNoteCodeLensProvider';

let notesProvider: NotesProvider;
let stickyNoteDecoration: vscode.TextEditorDecorationType;

function highlightStickyNotesInEditor(editor: vscode.TextEditor | undefined, notes: StickyNote[]) {
    if (!editor) return;
    const filePath = editor.document.uri.fsPath;
    const decorations: vscode.DecorationOptions[] = [];
    for (const note of notes) {
        if (note.file === filePath && note.line < editor.document.lineCount) {
            const lineLength = editor.document.lineAt(note.line).text.length;
            // Show only the first line with ellipsis if multiline
            const summary = note.content.split(/\r?\n/)[0] + (note.content.includes('\n') ? ' …' : '');
            decorations.push({
                range: new vscode.Range(note.line, lineLength, note.line, lineLength),
                hoverMessage: new vscode.MarkdownString(`**Sticky Note:**\n${note.content}`),
                renderOptions: {
                    after: {
                        contentText: ` 🟨 ${summary}`,
                        color: '#FFC107',
                        fontStyle: 'italic',
                        margin: '0 0 0 1em'
                    }
                }
            });
        }
    }
    editor.setDecorations(stickyNoteDecoration, decorations);
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    stickyNoteDecoration = vscode.window.createTextEditorDecorationType({
        // No background or border, just inline note
    });

    console.log('CodeNotes extension activated');
    notesProvider = new NotesProvider(context);
    vscode.window.registerTreeDataProvider('codenotesNotesView', notesProvider);

    // Highlight sticky notes on active editor
    function updateHighlights() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        const notes = notesProvider.getNotes();
        highlightStickyNotesInEditor(editor, notes);
    }

    vscode.window.onDidChangeActiveTextEditor(() => updateHighlights());
    vscode.workspace.onDidChangeTextDocument(() => updateHighlights());
    notesProvider.onDidChangeTreeData(() => updateHighlights());

    // Initial highlight
    setTimeout(updateHighlights, 500);


    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "codenotes" is now active!');

    // Hello World command (keep for now)
    const disposable = vscode.commands.registerCommand('codenotes.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from CodeNotes!');
    });
    context.subscriptions.push(disposable);

    // Reveal note command
    context.subscriptions.push(vscode.commands.registerCommand('codenotes.revealNote', (note: StickyNote) => {
        const openPath = vscode.Uri.file(note.file);
        vscode.workspace.openTextDocument(openPath).then(doc => {
            vscode.window.showTextDocument(doc, { preview: false }).then(editor => {
                const range = new vscode.Range(note.line, 0, note.line, 0);
                editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                editor.selection = new vscode.Selection(note.line, 0, note.line, 0);
            });
        });
    }));

    // Delete Sticky Note command
    context.subscriptions.push(vscode.commands.registerCommand('codenotes.deleteNote', async (note: StickyNote) => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }
        const notesFile = path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'notes.json');
        if (!fs.existsSync(notesFile)) {
            vscode.window.showErrorMessage('No notes file found.');
            return;
        }
        try {
            const raw = fs.readFileSync(notesFile, 'utf8');
            let notes: StickyNote[] = JSON.parse(raw);
            notes = notes.filter(n => !(n.file === note.file && n.line === note.line && n.content === note.content && n.created === note.created));
            fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2), 'utf8');
            vscode.window.showInformationMessage('Sticky note deleted.');
            notesProvider.refresh();
        } catch (err) {
            vscode.window.showErrorMessage('Failed to delete sticky note.');
        }
    }));

    // Delete Selected Sticky Note (Command Palette)
    context.subscriptions.push(vscode.commands.registerCommand('codenotes.deleteSelectedNote', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }
        const notesFile = path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'notes.json');
        if (!fs.existsSync(notesFile)) {
            vscode.window.showErrorMessage('No notes file found.');
            return;
        }
        let notes: StickyNote[] = [];
        try {
            const raw = fs.readFileSync(notesFile, 'utf8');
            notes = JSON.parse(raw);
        } catch (err) {
            vscode.window.showErrorMessage('Failed to read notes.');
            return;
        }
        if (notes.length === 0) {
            vscode.window.showInformationMessage('No sticky notes to delete.');
            return;
        }
        const pick = await vscode.window.showQuickPick(
            notes.map((n, idx) => ({
                label: `${path.basename(n.file)}:${n.line + 1} - ${n.content}`,
                detail: n.file,
                note: n,
                idx
            })),
            { placeHolder: 'Select a sticky note to delete' }
        );
        if (!pick) return;
        const filtered = notes.filter((n, i) => i !== pick.idx);
        try {
            fs.writeFileSync(notesFile, JSON.stringify(filtered, null, 2), 'utf8');
            notesProvider.refresh();
            vscode.window.showInformationMessage('Sticky note deleted.');
        } catch (err) {
            vscode.window.showErrorMessage('Failed to delete sticky note.');
        }
    }));

    // Register CodeLens provider for sticky notes
    let notesFile: string | undefined;
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        notesFile = path.join(workspaceRoot, '.vscode', 'notes.json');
    }
    const codeLensProvider = new StickyNoteCodeLensProvider(notesFile);
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider({ scheme: 'file' }, codeLensProvider)
    );

    // Command to open sticky note in Webview
    context.subscriptions.push(vscode.commands.registerCommand('codenotes.openStickyNote', (note) => {
        NoteWebview.show(
            `Sticky Note for ${path.basename(note.file)}:${note.line + 1}`,
            (updatedContent: string) => {
                if (!updatedContent || updatedContent.trim() === '') {
                    vscode.window.showWarningMessage('Sticky note is empty.');
                    return;
                }
                // Update the note in notes.json
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders || workspaceFolders.length === 0) {
                    vscode.window.showErrorMessage('No workspace folder found.');
                    return;
                }
                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                const notesDir = path.join(workspaceRoot, '.vscode');
                const notesFile = path.join(notesDir, 'notes.json');
                try {
                    if (!fs.existsSync(notesFile)) {
                        vscode.window.showErrorMessage('No sticky notes found to update.');
                        return;
                    }
                    let notes: any[] = [];
                    const raw = fs.readFileSync(notesFile, 'utf8');
                    notes = JSON.parse(raw);
                    // Find the note by file and line
                    const idx = notes.findIndex(n => n.file === note.file && n.line === note.line && n.created === note.created);
                    if (idx !== -1) {
                        notes[idx].content = updatedContent;
                        fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2), 'utf8');
                        vscode.window.showInformationMessage('Sticky note updated!');
                        notesProvider.refresh();
                    } else {
                        vscode.window.showErrorMessage('Could not find the sticky note to update.');
                    }
                } catch (err: any) {
                    vscode.window.showErrorMessage('Failed to update sticky note: ' + err.message);
                }
            },
            undefined,
            note.content
        );
    }));

    // Add Sticky Note command (now uses Webview for multiline input)
    const addStickyNoteDisposable = vscode.commands.registerCommand('codenotes.addStickyNote', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found.');
            return;
        }
        const document = editor.document;
        const filePath = document.uri.fsPath;
        const lineNumber = editor.selection.active.line;

        NoteWebview.show(
            `Sticky Note for ${path.basename(filePath)}:${lineNumber + 1}`,
            async (noteContent: string) => {
                if (!noteContent || noteContent.trim() === '') {
                    vscode.window.showWarningMessage('Sticky note is empty.');
                    return;
                }
                // Prepare note object
                const note = {
                    file: filePath,
                    line: lineNumber,
                    content: noteContent,
                    created: new Date().toISOString()
                };
                // Save note to .vscode/notes.json in the workspace
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders || workspaceFolders.length === 0) {
                    vscode.window.showErrorMessage('No workspace folder found.');
                    return;
                }
                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                const notesDir = path.join(workspaceRoot, '.vscode');
                const notesFile = path.join(notesDir, 'notes.json');
                try {
                    if (!fs.existsSync(notesDir)) {
                        fs.mkdirSync(notesDir);
                    }
                    let notes: any[] = [];
                    if (fs.existsSync(notesFile)) {
                        const raw = fs.readFileSync(notesFile, 'utf8');
                        notes = JSON.parse(raw);
                    }
                    notes.push(note);
                    fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2), 'utf8');
                    vscode.window.showInformationMessage('Sticky note added!');
                    notesProvider.refresh();
                } catch (err: any) {
                    vscode.window.showErrorMessage('Failed to save sticky note: ' + err.message);
                }
            }
        );
    });
    context.subscriptions.push(addStickyNoteDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
