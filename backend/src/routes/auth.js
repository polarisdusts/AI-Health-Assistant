const express = require("express");
const bcrypt = require("bcryptjs");
const { User } = require("../models");

const router = express.Router();

// 注册
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "请填写所有必填字段" });
    }

    const existingUser = await User.findOne({
      where: {
        [require("sequelize").Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(409).json({ error: "用户名或邮箱已被注册" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    //设置session用于登录
    req.session.userId = user.id;
    req.session.username = user.username;

    res.status(201).json({
      message: "注册成功",
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("注册失败:", err);
    res.status(500).json({ error: "注册失败，请稍后重试" });
  }
});

// 登录
router.post("/login", async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "请输入用户名和密码" });
    }

    const user = await User.findOne({
      where: {
        [require("sequelize").Op.or]: [{ username }, { email: username }],
      },
    });

    if (!user) {
      return res.status(401).json({ error: "用户名或密码错误" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "用户名或密码错误" });
    }

    // 如果勾选记住我，延长session过期时间
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30天
      await user.update({ remember_me: true });
    } else {
      req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24小时
      await user.update({ remember_me: false });
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({
      message: "登录成功",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        hasProfile: !!(user.age && user.height && user.weight),
      },
    });
  } catch (err) {
    console.error("登录失败:", err);
    res.status(500).json({ error: "登录失败，请稍后重试" });
  }
});

// 登出
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "登出失败" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "已登出" });
  });
});

// 获取当前登录用户信息
router.get("/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "未登录" });
    }

    const user = await User.findByPk(req.session.userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ error: "用户不存在" });
    }

    res.json({ user });
  } catch (err) {
    console.error("获取用户信息失败:", err);
    res.status(500).json({ error: "获取用户信息失败" });
  }
});

module.exports = router;
