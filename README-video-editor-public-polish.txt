Goblin Video Editor public-readiness polish

Added practical pre-launch fixes:
- Media library now has Add, Clear unused, and Clear all controls.
- Removing a media asset that is used on the timeline now asks for confirmation.
- New/open project releases old preview object URLs without deleting saved-project media blobs.
- Duplicate imports are skipped with a clear warning.
- File picker cancel no longer triggers an import/loading state.
- Media cards show file size, dimensions, duration, and timeline usage count.
- Project open/new actions now warn before replacing the current workspace.
- Project manager shows approximate browser storage usage when the browser supports it.
- Export blocks missing-media timelines with a clear reimport/remove message.
- Export download object URLs stay alive longer for large WebM downloads.

Still test manually before public launch:
1. Import several media files and remove one used on the timeline.
2. Clear unused media after adding/removing timeline clips.
3. Start a new project and verify the old media library clears while saved projects can still reopen.
4. Import a .goblin project and verify missing media warnings are understandable.
5. Export a short WebM and verify download completes.
