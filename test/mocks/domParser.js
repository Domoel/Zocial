// Enough of DOMParser for text extraction: strip tags.
globalThis.DOMParser = class {
  parseFromString (html) {
    return { documentElement: { textContent: String(html).replace(/<[^>]*>/g, '') } }
  }
}
