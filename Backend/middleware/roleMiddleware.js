exports.authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    return next(new Error('Not authenticated'));
  }
  const normalizedAllowed = roles.map((role) => String(role || '').toLowerCase());
  const currentRole = String(req.user.role || '').toLowerCase();
  if (!normalizedAllowed.includes(currentRole)) {
    res.status(403);
    return next(new Error('Forbidden: insufficient role'));
  }
  next();
};
