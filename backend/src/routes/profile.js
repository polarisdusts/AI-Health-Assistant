const express = require("express");
const { User } = require("../models");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// 获取健康档案
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId, {
      attributes: { exclude: ["password"] },
    });
    res.json({ profile: user });
  } catch (err) {
    res.status(500).json({ error: "获取健康档案失败" });
  }
});

// 更新健康档案
router.put("/", requireAuth, async (req, res) => {
  try {
    //字段过滤
    const allowedFields = [
      "age",
      "gender",
      "height",
      "weight",
      "activity_level",
      "diet_preference",
      "health_goal",
      "daily_calorie_goal",
      "daily_step_goal",
      "daily_activity_goal",
    ];

    const updates = {}; //创建空对象存储合法的更新字段
    allowedFields.forEach((field) => {
      //遍历允许的字段列表
      if (req.body[field] !== undefined) {
        //允许字段
        updates[field] = req.body[field];
      }
    });

    //查找并更新用户
    const user = await User.findByPk(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "用户不存在" });
    }

    await user.update(updates);

    // 如果是初次录入体重，同时记录一条体重记录
    if (req.body.weight && !req.body._skipWeightRecord) {
      const { WeightRecord } = require("../models");
      await WeightRecord.create({
        user_id: user.id,
        weight: req.body.weight,
        record_date: new Date().toISOString().split("T")[0],
        note: "初始记录",
      });
    }

    const updatedUser = await User.findByPk(req.session.userId, {
      attributes: { exclude: ["password"] },
    });

    res.json({ message: "健康档案已更新", profile: updatedUser });
  } catch (err) {
    console.error("更新健康档案失败:", err);
    res.status(500).json({ error: "更新健康档案失败" });
  }
});

module.exports = router;
