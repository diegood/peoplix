import { extractRefFromElement } from './href-parser'

/**
 * Transforma referencias RF en chips visuales para preview
 * @param {string} content
 * @returns {string} transformed HTML content
 */
export const transformReferencesToHtml = (content) => {
  if (!content) return 'Sin contenido'
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')
  doc.querySelectorAll('a.rf-ref, span.rf-ref').forEach(el => {
    const ref = extractRefFromElement(el)
    if (!ref) return
    const num = ref.number
    const section = ref.section || ref.sectionId
    const chip = `<span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded text-xs font-medium">RF-${num}: ${section}</span>`
    el.replaceWith(parser.parseFromString(chip, 'text/html').body.firstChild)
  })

  return doc.body.innerHTML
}

/**
 * Renderiza una referencia como chip con estilo
 * inputs: {string} number, {string} section
 * returns: {string} HTML chip
 */
export const renderReferenceChip = (number, section) => {
  return `<span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded text-xs font-medium">RF-${number}: ${section}</span>`
}
