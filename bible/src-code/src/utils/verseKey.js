// Shared helpers for identifying a specific verse across translations,
// and the palette used by the verse-highlighting feature.

export function verseKey(translationId, book, chapter, verse) {
  return `${translationId}|${book}|${chapter}|${verse}`
}

// name -> { bg, label } used by the highlight color picker and rendering.
// Muted/translucent so verse text (cream on near-black) stays readable
// when a highlight color sits behind it.
export const HIGHLIGHT_COLORS = {
  yellow: { bg: 'rgba(201, 168, 76, 0.28)', label: 'Yellow' },
  green: { bg: 'rgba(143, 174, 120, 0.28)', label: 'Green' },
  blue: { bg: 'rgba(122, 162, 196, 0.28)', label: 'Blue' },
  pink: { bg: 'rgba(196, 122, 152, 0.28)', label: 'Pink' },
  purple: { bg: 'rgba(160, 122, 196, 0.28)', label: 'Purple' },
}
