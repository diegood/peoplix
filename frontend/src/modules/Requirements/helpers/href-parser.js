
/**
 * Parsea un href de referencia RF ej: "/org/projects/proj/requirements/12/section/intro?rfId=uuid"
 * @param {string} href
 * @returns { object | null } { number, sectionId, id }
 */
export const parseHrefRef = (href) => {
  if (!href) return null
  const regex = /\/requirements\/(\d+)\/section\/([a-z]+)(\?rfId=([a-f0-9-]+))?/
  const m = href.match(regex)
  if (!m) return null
  return { 
    number: m[1], 
    sectionId: m[2],
    id: m[4] // UUID desde query param
  }
}

/**
 * Extrae información de referencia desde un elemento anchor/span
 * @param {HTMLElement} el
 * @returns { object | null } { text, number, title, section, id, sectionId }
 */
export const extractRefFromElement = (el) => {
  const hrefRef = parseHrefRef(el.getAttribute('href'))
  if (!hrefRef) return null
  
  const id = hrefRef.id
  const sectionId = hrefRef.sectionId
  const number = hrefRef.number

  if (!id || !sectionId || !number) return null

  return {
    text: el.outerHTML,
    number: String(number),
    title: extractTitleFromElement(el.textContent),
    section: extractSectionFromElement(el.textContent),
    id,
    sectionId
  }
}

/**
 * Extrae todas las referencias del contenido HTML
 * @param {string} modelValue
 * @returns {Array<{ number, sectionId, title, section, id }>}
 */
export const extractAllReferences = (modelValue) => {
  const matches = []

  if (modelValue) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(modelValue, 'text/html')
    
    doc.querySelectorAll('a[href*="/requirements/"][href*="/section/"]').forEach(el => {
      const ref = extractRefFromElement(el)
      if (ref) {
        matches.push(ref)
      }
    })
  }

  return matches
}

/**
 * Extrae el título (nombre del RF) del texto del elemento
 * @param {string} text
 * @returns {string} title
 */
const extractTitleFromElement = (text) => {
  const regex = /RF-\d+:\s([^()]+)\s\(/
  const m = text.match(regex)
  return m ? m[1].trim() : text
}

/**
 * Extrae la etiqueta de sección del texto del elemento
 * @param {string} text
 * @returns {string} section label
 */
const extractSectionFromElement = (text) => {
  const regex = /\(([^)]+)\)/
  const m = text.match(regex)
  return m ? m[1] : ''
}
