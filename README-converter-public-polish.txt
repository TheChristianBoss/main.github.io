Christian Goblin File Converter — Public-Polish Review

This patch focuses on practical visitor issues before public release:

1. Single-file modules now avoid confusing Add more files behavior. For media/text tools that use one file, visitors are told to replace the file instead of appending another one.
2. Dropping a new file onto a single-file module replaces the selected file instead of trapping the old file first.
3. Added selected-file compatibility warnings when the current module and selected files do not match.
4. Added a Start over button to clear selected files, session history, and reset the app to the Images module.
5. Increased download object URL lifetime for more reliable large downloads on slower browsers.
6. Added Cancel batch support so users can stop long batch queues after the current file finishes.
7. Media cancel now gives a useful message while the FFmpeg engine is still loading.
8. Bumped the service worker cache to help visitors get the newest converter shell after deploy.

Recommended manual checks:
- Drop one photo, convert to WEBP, then clear selected files.
- Drop two photos, remove one, add another, and convert to ZIP.
- In Audio/Video, select one video, then use Choose / replace files to swap it.
- In Audio/Video, confirm Add more files says One file at a time.
- Run a batch conversion, then click Cancel batch during the queue.
- Switch modules with selected files and confirm warnings are helpful, not scary.
