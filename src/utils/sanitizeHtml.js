const sanitizeHtml = require('sanitize-html');

/**
 * Sanitize HTML content to prevent XSS attacks
 * Allows safe HTML tags for rich text content
 */
const sanitizeContent = (html) => {
  if (!html) return html;

  return sanitizeHtml(html, {
    allowedTags: [
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      
      // Text formatting
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark',
      
      // Lists
      'ul', 'ol', 'li',
      
      // Links
      'a',
      
      // Quotes
      'blockquote',
      
      // Code
      'code', 'pre',
      
      // Tables
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      
      // Divs and spans for styling
      'div', 'span',
      
      // Images
      'img',
      
      // Line breaks
      'hr',
    ],
    
    allowedAttributes: {
      'a': ['href', 'title', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'div': ['class'],
      'span': ['class'],
      'code': ['class'],
      'pre': ['class'],
      'h1': ['id'],
      'h2': ['id'],
      'h3': ['id'],
      'h4': ['id'],
      'h5': ['id'],
      'h6': ['id'],
    },
    
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    
    // Automatically add rel="noopener noreferrer" to external links
    transformTags: {
      'a': (tagName, attribs) => {
        if (attribs.href && (attribs.href.startsWith('http://') || attribs.href.startsWith('https://'))) {
          return {
            tagName: 'a',
            attribs: {
              ...attribs,
              rel: 'noopener noreferrer',
              target: '_blank',
            },
          };
        }
        return { tagName, attribs };
      },
    },
  });
};

module.exports = {
  sanitizeContent,
};

