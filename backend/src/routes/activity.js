const express = require("express");
const { ActivityRecord } = require("../models");
const { requireAuth } = require("../middleware/auth");
const { Op } = require("sequelize");

const router = express.Router();

// 运动类型枚举与对应参数
const ACTIVITY_META = {
  outdoor_run: {
    name: "户外跑步",
    calPerMin: 9,
    stepsPerMin: 150,
    defaultMV: true,
  },
  walking: {
    name: "健走",
    calPerMin: 5,
    stepsPerMin: 120,
    defaultMV: false,
  },
  outdoor_cycle: {
    name: "户外骑行",
    calPerMin: 7,
    stepsPerMin: 90,
    defaultMV: true,
  },
  indoor_run: {
    name: "室内跑步",
    calPerMin: 8,
    stepsPerMin: 140,
    defaultMV: true,
  },
  jump_rope: {
    name: "跳绳",
    calPerMin: 10,
    stepsPerMin: 160,
    defaultMV: true,
  },
  swimming: {
    name: "游泳",
    calPerMin: 8,
    stepsPerMin: 60,
    defaultMV: true,
  },
  yoga: {
    name: "瑜伽",
    calPerMin: 3,
    stepsPerMin: 40,
    defaultMV: false,
  },
  strength: {
    name: "力量训练",
    calPerMin: 6,
    stepsPerMin: 30,
    defaultMV: true,
  },
  hiit: {
    name: "HIIT间歇",
    calPerMin: 11,
    stepsPerMin: 130,
    defaultMV: true,
  },
  badminton: {
    name: "羽毛球",
    calPerMin: 7,
    stepsPerMin: 100,
    defaultMV: true,
  },
  other: {
    name: "其他运动",
    calPerMin: 5,
    stepsPerMin: 80,
    defaultMV: false,
  },
};

// 记录运动活动
router.post("/", requireAuth, async (req, res) => {
  try {
    const { activity_type, duration, distance } = req.body;
    if (!activity_type || !duration) {
      return res.status(400).json({ error: "请选择运动类型并填写时长" });
    }

    const meta = ACTIVITY_META[activity_type];
    if (!meta) {
      return res.status(400).json({ error: "无效的运动类型" });
    }

    const caloriesBurned = Math.round(meta.calPerMin * duration);
    const stepsEstimated = Math.round(meta.stepsPerMin * duration);
    const isMV = meta.defaultMV;
    const avgHeartRate = isMV
      ? Math.round(120 + Math.random() * 30)
      : Math.round(90 + Math.random() * 20);

    const record = await ActivityRecord.create({
      user_id: req.session.userId,
      activity_type,
      activity_name: meta.name,
      duration,
      distance: distance || null,
      calories_burned: caloriesBurned,
      steps_estimated: stepsEstimated,
      is_moderate_vigorous: isMV,
      avg_heart_rate: avgHeartRate,
      record_date: new Date().toISOString().split("T")[0],
    });

    res.status(201).json({
      message: "运动记录成功",
      record: {
        ...record.toJSON(),
        activity_name: meta.name,
      },
    });
  } catch (err) {
    console.error("记录运动失败:", err);
    res.status(500).json({ error: "记录运动失败" });
  }
});

// 获取运动记录
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

    // Default: current month
    if (!start_date && !end_date) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];
      where.record_date = { [Op.between]: [firstDay, lastDay] };
    }

    const records = await ActivityRecord.findAll({
      where,
      order: [["record_date", "DESC"], ["id", "DESC"]],
      limit: limit ? parseInt(limit) : undefined,
    });

    // Add activity names
    const enriched = records.map((r) => {
      const data = r.toJSON();
      data.activity_name = ACTIVITY_META[r.activity_type]?.name || "其他运动";
      return data;
    });

    // Calculate summaries
    const totalCalories = enriched.reduce((s, a) => s + a.calories_burned, 0);
    const totalSteps = enriched.reduce((s, a) => s + (a.steps_estimated || 0), 0);
    const totalActivities = enriched.length;
    const mvCount = enriched.filter((a) => a.is_moderate_vigorous).length;

    res.json({
      records: enriched,
      summary: {
        totalCalories,
        totalSteps,
        totalActivities,
        mvCount,
      },
    });
  } catch (err) {
    console.error("获取运动记录失败:", err);
    res.status(500).json({ error: "获取运动记录失败" });
  }
});

// 获取运动类型列表
router.get("/types", requireAuth, (req, res) => {
  const types = Object.entries(ACTIVITY_META).map(([key, val]) => ({
    type: key,
    name: val.name,
  }));
  res.json({ types });
});

// 删除运动记录
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const record = await ActivityRecord.findOne({
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
