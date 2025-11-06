/**
 * Middleware to parse JSON strings in form-data
 * Useful for parsing arrays and objects sent as strings in multipart/form-data
 */
const parseFormData = (...fields) => {
  return (req, res, next) => {
    if (req.body) {
      fields.forEach((field) => {
        // Check if field exists (including empty strings)
        if (req.body[field] !== undefined && req.body[field] !== null) {
          // If it's already an array or object, skip it
          if (Array.isArray(req.body[field]) || (typeof req.body[field] === 'object' && req.body[field] !== null)) {
            return;
          }
          
          // If it's a string, try to parse it
          if (typeof req.body[field] === 'string') {
            // Handle empty string
            if (req.body[field].trim() === '' || req.body[field].trim() === 'null') {
              req.body[field] = null;
              return;
            }
            
            try {
              const parsed = JSON.parse(req.body[field]);
              req.body[field] = parsed;
            } catch (error) {
              // If parsing fails, leave it as is and let validation catch it
              // This allows single UUID strings to pass through
            }
          }
        }
      });
    }
    next();
  };
};

module.exports = parseFormData;

