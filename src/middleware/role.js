const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by auth middleware
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        message: "Access denied: no role information",
      });
    }

    // Check if user's role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden: insufficient rights",
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
