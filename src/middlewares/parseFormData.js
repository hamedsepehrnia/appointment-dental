/**
 * Middleware to parse JSON strings in form-data
 * Useful for parsing arrays sent as strings in multipart/form-data
 */
const parseFormData = (...fields) => {
  return (req, res, next) => {
    if (req.body) {
      fields.forEach((field) => {
        if (req.body[field]) {
          // If it's already an array, skip it
          if (Array.isArray(req.body[field])) {
            return;
          }
          
          // If it's a string, try to parse it
          if (typeof req.body[field] === 'string') {
            try {
              const parsed = JSON.parse(req.body[field]);
              req.body[field] = parsed;
              console.log(`✓ Parsed ${field}:`, parsed);
            } catch (error) {
              // If parsing fails, leave it as is and let validation catch it
              console.error(`✗ Failed to parse ${field}:`, error.message);
              console.error(`  Value was:`, req.body[field]);
            }
          }
        }
      });
    }
    next();
  };
};

module.exports = parseFormData;

