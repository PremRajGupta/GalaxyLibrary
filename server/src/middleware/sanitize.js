/**
 * Security Middleware: NoSQL Injection & Input Sanitizer
 * Protects MongoDB queries from malicious operator injection ($where, $gt, $regex, etc.)
 * and sanitizes user input against basic XSS payload injection.
 */

const hasNoSqlInjection = (target) => {
  if (!target || typeof target !== 'object') return false;

  for (const key of Object.keys(target)) {
    // Check if key starts with '$' (MongoDB operator) or contains '.'
    if (key.startsWith('$') || key.includes('.')) {
      return true;
    }
    // Recursively inspect nested objects and arrays
    if (typeof target[key] === 'object' && hasNoSqlInjection(target[key])) {
      return true;
    }
  }
  return false;
};

const sanitizeObject = (target) => {
  if (!target || typeof target !== 'object') return target;

  if (Array.isArray(target)) {
    return target.map(sanitizeObject);
  }

  const clean = {};
  for (const [key, value] of Object.entries(target)) {
    // Drop keys that start with '$' or contain '.'
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    if (typeof value === 'string') {
      // Strip potentially malicious script tags / HTML injections
      clean[key] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeObject(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
};

export const sanitizeInput = (req, res, next) => {
  try {
    // If NoSQL operator detected in query params, reject immediately
    if (req.query && hasNoSqlInjection(req.query)) {
      return res.status(400).json({
        success: false,
        message: 'Security Alert: Malicious query parameters detected and blocked.'
      });
    }

    // Sanitize body, query, and params in place
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    next();
  }
};

export default sanitizeInput;
