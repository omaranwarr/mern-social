/**
 * User input sanitization to prevent XSS. Scripts and HTML are escaped
 * so they are stored and displayed as plain text, not executed.
 */
import xss from 'xss'

/**
 * Sanitize a string so scripts/HTML are escaped and displayed as plain text.
 * @param {string} input - Raw user input
 * @returns {string} Sanitized string safe for storage and display
 */
export function sanitizeString(input) {
  if (input == null || typeof input !== 'string') return input
  return xss(input, { whiteList: {} })
}
