/**
 * Extracts the title from a requirement text. ej: "RF-12: User Login (Authentication)"
 * @param {string} text 
 * @returns {string} title
 */
export const extractTitleFromText = (text) => {
  const regex = /RF-\d+:\s([^()]+)\s\(/
  const m = text.match(regex)
  return m ? m[1].trim() : text
}

/**
 * Extracts the section label from a requirement text. ej: "RF-12: User Login (Authentication)"
 * @param {string} text 
 * @returns {string} section label
 */
export const extractSectionLabelFromText = (text) => {
  const regex = /\(([^)]+)\)/
  const m = text.match(regex)
  return m ? m[1] : ''
}

/**
 * Extracts the requirement number from a requirement text. ej: "RF-12: User Login (Authentication)"
 * @param {string} text 
 * @returns {string} requirement number
 */
export const extractNumberFromText = (text) => {
  const regex = /RF-(\d+)/
  const m = text.match(regex)
  return m ? m[1] : ''
}
