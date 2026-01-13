/**
 * Make first letter uppercase
 * @param {string} str string to make first letter uppercase
 * @returns {string} string with first letter uppercase
 */
export function upperFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
/**
 * Convert string to camelCase
 * @param {string} str string to convert to camelCase
 * @returns {string} string in camelCase
 */
export function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
    if (+match === 0) return ''
    return index === 0 ? match.toLowerCase() : match.toUpperCase()
  })
}
/**
 * Remove special characters from string
 * @param {string} str string to remove special characters from
 * @returns {string} string without special characters
 */
export function removeSpecialChars(str) {
  return str.replace(/[^a-zA-Z ]/g, '')
}
/**
 * Get acronym from string Example: "Workload" -> "WOR" Or "Workload Management System" -> "WMS"
 * @param {string} str string to get acronym from
 * @returns {string} acronym
 */
export function getAcronym(str) {
  const words = removeSpecialChars(str).trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase()
  }
  return words.map((word) => word.charAt(0).toUpperCase()).join('')
}

/**
 * Capitalize first letter of string
 * @param {string} word string to capitalize first letter
 * @returns {string} string with first letter capitalized
 */
export const firstCapitalize = (word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`