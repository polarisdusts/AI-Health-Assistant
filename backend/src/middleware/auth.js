const requireAuth = (req, res, next) => {
  //三个参数分别为请求对象，响应对象和调用下一中间件的函数
  if (!req.session || !req.session.userId) {
    //检查session.userID是否存在
    return res.status(401).json({ error: "未登录，请先登录" });
  }
  next();
};

const optionalAuth = (req, res, next) => {
  next();
};

module.exports = { requireAuth, optionalAuth };
