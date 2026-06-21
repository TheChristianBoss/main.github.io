// Dynamically loads a translation's verse data only when needed,
// so we don't bundle all 90 translations' text into one giant file.
//
// Vite's import.meta.glob with { eager: false } gives us a map of
// id -> () => Promise<module>, which we can call on demand.

const textModules = import.meta.glob('../data/translations/*.json')

// Cache loaded translations in memory so switching back and forth
// between translations you've already opened doesn't refetch them.
const cache = new Map()

/**
 * Load the verse data for a translation by its catalog `file` id.
 * Returns null if no text file exists yet (e.g. pending-review entries).
 */
export async function loadTranslationText(fileId) {
  if (!fileId) return null
  if (cache.has(fileId)) return cache.get(fileId)

  const path = `../data/translations/${fileId}.json`
  const importer = textModules[path]
  if (!importer) return null

  const mod = await importer()
  const data = mod.default
  cache.set(fileId, data)
  return data
}
