/**
 * Crea el HTML para insertar una referencia RF
 * @param {object} requirement - { number, title, id }
 * @param {string} sectionId
 * @param {string} sectionLabel
 * @param {string} orgTag
 * @param {string} projectTag
 * @returns {string} HTML anchor
 */
export const createReferenceLink = (requirement, sectionId, sectionLabel, orgTag, projectTag) => {
  const href = `/${orgTag}/projects/${projectTag}/requirements/${requirement.number}/section/${sectionId}?rfId=${requirement.id}`
  return `<a class="rf-ref inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded text-xs font-medium" href="${href}">RF-${requirement.number}: ${requirement.title} (${sectionLabel})</a>`
}

/**
 * Genera una URL de referencia RF
 * @param {string} requirementNumber
 * @param {string} sectionId
 * @param {string} orgTag
 * @param {string} projectTag
 * @param {string} requirementId
 * @returns {string} URL
 */
export const buildReferenceUrl = (requirementNumber, sectionId, orgTag, projectTag, requirementId) => {
  return `/${orgTag}/projects/${projectTag}/requirements/${requirementNumber}/section/${sectionId}?rfId=${requirementId}`
}

/**
 * Crea un objeto de referencia desde datos básicos
 * @param {string|number} number
 * @param {string} sectionId
 * @param {string} title
 * @param {string} section
 * @param {string} id
 * @returns {object} reference object
 */
export const createReferenceObject = (number, sectionId, title, section, id) => {
  return {
    number: String(number),
    sectionId,
    title,
    section,
    id
  }
}
