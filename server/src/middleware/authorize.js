/**
 * Returns an Express middleware that restricts access to the given roles.
 * Must be used after the `authenticate` middleware so that req.user is populated.
 *
 * Usage:
 *   router.get('/owner-only', authenticate, authorize('RESTAURANT_OWNER'), handler);
 *   router.get('/any-user',   authenticate, authorize('DINER', 'RESTAURANT_OWNER'), handler);
 *
 * @param {...string} allowedRoles
 * @returns {import('express').RequestHandler}
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    return next();
  };
}

module.exports = authorize;
