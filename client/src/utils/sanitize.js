import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} dirty - The potentially unsafe HTML string
 * @param {object} config - Optional DOMPurify configuration
 * @returns {string} - Sanitized HTML string safe for rendering
 */
export const sanitizeHTML = (dirty, config = {}) => {
    if (!dirty || typeof dirty !== 'string') {
        return '';
    }

    // Default configuration - very restrictive
    const defaultConfig = {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span'],
        ALLOWED_ATTR: ['class'],
        KEEP_CONTENT: true,
        ...config
    };

    return DOMPurify.sanitize(dirty, defaultConfig);
};

/**
 * Sanitizes user text input by stripping all HTML tags
 * Use this for displaying user-generated text content
 * @param {string} text - The potentially unsafe text
 * @returns {string} - Plain text with all HTML removed
 */
export const sanitizeText = (text) => {
    if (!text || typeof text !== 'string') {
        return '';
    }

    // Strip all HTML tags, return only text
    return DOMPurify.sanitize(text, {
        ALLOWED_TAGS: [],
        KEEP_CONTENT: true
    });
};

/**
 * Encodes special HTML characters to prevent XSS
 * Useful for displaying user input in attributes or as text
 * @param {string} str - The string to encode
 * @returns {string} - HTML-encoded string
 */
export const encodeHTML = (str) => {
    if (!str || typeof str !== 'string') {
        return '';
    }

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

export default {
    sanitizeHTML,
    sanitizeText,
    encodeHTML
};
