const express = require("express");
const { WeightRecord } = require("../models");
const { requireAuth } = require("../middleware/auth");
const { Op } = require("sequelize");

const router = express.Router();

// 记录体重
router.post("/", requireAuth, async (req, res) => {
  try {
    const { weight, note } = req.body;
    if (!weight) {
      return res.status(400).json({ error: "请填写体重" });
    }

    const today = new Date().toISOString().split("T")[0];

    // 检查今天是否已有记录
    const existing = await WeightRecord.findOne({
      where: {
        user_id: req.session.userId,
        record_date: today,
      },
    });

    if (existing) {
      // 更新今日记录
      await existing.update({ weight, note: note || existing.note });
      return res.json({ message: "体重已更新", record: existing });
    }

    const record = await WeightRecord.create({
      user_id: req.session.userId,
      weight,
      record_date: today,
      note,
    });

    // 同时更新用户当前体重
    const { User } = require("../models");
    await User.update({ weight }, { where: { id: req.session.userId } });

    res.status(201).json({ message: "体重记录成功", record });
  } catch (err) {
    console.error("记录体重失败:", err);
    res.status(500).json({ error: "记录体重失败" });
  }
});

// 获取体重历史
router.get("/", requireAuth, async (req, res) => {
  try {
    const { start_date, end_date, limit } = req.query;
    const where = { user_id: req.session.userId };

    if (start_date && end_date) {
      where.record_date = { [Op.between]: [start_date, end_date] };
    } else if (start_date) {
      where.record_date = { [Op.gte]: start_date };
    } else if (end_date) {
      where.record_date = { [Op.lte]: end_date };
    }

    const records = await WeightRecord.findAll({
      where,
      order: [["record_date", "ASC"]],
      limit: limit ? parseInt(limit) : undefined,
    });

    res.json({ records });
  } catch (err) {
    console.error("获取体重记录失败:", err);
    res.status(500).json({ error: "获取体重记录失败" });
  }
});

// 删除某条体重记录
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const record = await WeightRecord.findOne({
      where: { id: req.params.id, user_id: req.session.userId },
    });
    if (!record) {
      return res.status(404).json({ error: "记录不存在" });
    }
    await record.destroy();
    res.json({ message: "记录已删除" });
  } catch (err) {
    res.status(500).json({ error: "删除失败" });
  }
});

module.exports = router;
