const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "未登录，请先登录" });
  }
  next();
};

const optionalAuth = (req, res, next) => {
  // Don't block, just continue
  next();
};

module.exports = { requireAuth, optionalAuth };
