Christian Goblin File Converter — bug check / practical polish patch

Reviewed areas:
- main converter shell and file selection flow
- image converter
- text/data converter
- document/PDF/spreadsheet tools
- ZIP tools
- batch queue
- utilities
- audio/video media module
- service worker/PWA shell

Fixed in this patch:
1. Added practical selected-file controls:
   - remove one file from the selected list
   - clear all selected files
   - add more files without replacing the current list
   - choose/replace files explicitly

2. Improved drag/drop behavior:
   - dropping files onto an existing selection now appends instead of silently replacing
   - file-picker Cancel still preserves the current files
   - keyboard activation prevents accidental page scrolling

3. Fixed async module race conditions:
   - fast module switching can no longer let an old lazy-loaded module overwrite the current module UI
   - module loading state resets even if a lazy import fails

4. Fixed image PDF binary handling:
   - image-to-PDF generation no longer writes JPEG bytes through a JavaScript string path that could corrupt binary image streams
   - the PDF builder now writes mixed text/binary Blob parts with correct byte offsets

5. Improved ZIP extraction behavior:
   - extracting ZIP files now downloads one extracted-files ZIP instead of triggering many separate downloads
   - extracted paths are sanitized to avoid unsafe path names

6. Improved media output handling:
   - FFmpeg output is written from the actual Uint8Array, not the whole underlying buffer
   - media conversion button is disabled until a media file is selected
   - cancel/unload gives a useful message when nothing is loaded

7. Improved stale-cache behavior:
   - service worker cache version bumped
   - service worker now uses network-first behavior so GitHub Pages updates are less likely to be hidden behind an old cached app shell

8. Improved duplicate-name handling in the batch queue:
   - queue statuses now key by file index rather than file name, so duplicate file names are tracked separately

9. Improved error messages:
   - modules now use the shared friendly error handler when possible

No report form/button was added.
