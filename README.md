# codenotes README

This is the README for your extension "codenotes". After writing up a brief description, we recommend including the following sections.

## Features

- **Sticky Note Naming**: Add or edit an optional title for each sticky note. The title appears in the sidebar and inline in the editor if set.
- **Color Editing**: Change the color of any sticky note at any time. The color picker and palette are always available when creating or editing notes.
- **Sidebar & Editor Sync**: Renaming or recoloring a note updates its appearance instantly in both the sidebar and the editor's inline highlight.

![](images/sticky-note-demo.png)

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## CodeNotes

Easily add sticky notes to any line of code, color-code them, and manage them via a sidebar. Notes persist across sessions, are highlighted in your editor, and can be searched, filtered, and deleted.

## Features

- **Sticky Notes**: Attach notes to any line of code in any file.
- **Color Coding**: Choose from a palette of colors or pick any custom color for each note.
- **Sidebar Management**: View, search, filter, and delete notes from the sidebar.
- **Sorting**: Notes in the sidebar are sorted by filename and line number for easy navigation.
- **Highlighting**: Annotated lines are decorated in the editor with your chosen color.
- **Multiline Notes**: Add detailed, multiline notes using a webview UI.
- **Persistent**: Notes are saved in `.vscode/notes.json` and persist across sessions.

## Usage

1. **Add a Sticky Note**
   - Right-click any line in your code and choose **Add Sticky Note**.
   - Or use the command palette: `CodeNotes: Add Sticky Note`.
   - Enter your note and select a color from the palette or use the custom color picker.
   - Click **Save**.

2. **View & Manage Notes**
   - Open the **CodeNotes** sidebar to see all notes, sorted by file and line.
   - Click a note to jump to its location.
   - Use the filter box to search notes by content, file, or line number.

3. **Edit or Delete Notes**
   - Click a note in the sidebar and use the context menu to edit or delete.
   - Or open a note and use the delete button in the webview.

## Screenshots

*(Add screenshots here of the sidebar, color picker, and sticky notes in the editor)*

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release notes.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
