const express = require("express");
const { HealthPlan, User, WeightRecord, ActivityRecord } = require("../models");
const { requireAuth } = require("../middleware/auth");
const {
  buildWeightTrendContext,
  buildMonthlySummary,
  buildAIPrompt,
} = require("../utils/promptBuilder");
const { generateMonthlyPlan, generateDetailedExercisePlan } = require("../utils/deepseekClient");

const router = express.Router();

// 生成月度计划
router.post("/generate-monthly", requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "用户不存在" });
    }

    if (!user.age || !user.height || !user.weight) {
      return res.status(400).json({
        error: "请先完善个人健康档案",
        needProfile: true,
      });
    }

    const weightRecords = await WeightRecord.findAll({
      where: { user_id: user.id },
      order: [["record_date", "ASC"]],
    });
    const weightContext = buildWeightTrendContext(weightRecords);

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const activities = await ActivityRecord.findAll({
      where: {
        user_id: user.id,
        record_date: { [require("sequelize").Op.between]: [firstDay, lastDay] },
      },
    });
    const monthlySummary = buildMonthlySummary(activities, month);

    const planData = await generateMonthlyPlan(user, weightContext, monthlySummary);
    const promptText = buildAIPrompt(user, weightContext, monthlySummary);

    const plan = await HealthPlan.create({
      user_id: user.id,
      plan_type: "monthly",
      plan_month: month,
      plan_data: JSON.stringify(planData),
      diet_plan: JSON.stringify(planData.diet_plan),
      exercise_plan: JSON.stringify(planData.exercise_plan),
      ai_analysis: promptText,
    });

    res.status(201).json({
      message: "月度计划已生成",
      plan: {
        id: plan.id,
        plan_month: month,
        diet_plan: planData.diet_plan,
        exercise_plan: planData.exercise_plan,
        summary: planData.summary,
        generated_at: plan.generated_at,
      },
    });
  } catch (err) {
    console.error("生成计划失败:", err);
    res.status(500).json({ error: "生成计划失败" });
  }
});

// 生成 30 天详细每日运动计划（PlanGenerator 专用）
router.post("/generate-detailed-exercise", requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "用户不存在" });
    }

    const { selectedTypes } = req.body || {};

    const weightRecords = await WeightRecord.findAll({
      where: { user_id: user.id },
      order: [["record_date", "ASC"]],
    });
    const weightContext = buildWeightTrendContext(weightRecords);

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const activities = await ActivityRecord.findAll({
      where: {
        user_id: user.id,
        record_date: { [require("sequelize").Op.between]: [firstDay, lastDay] },
      },
    });
    const monthlySummary = buildMonthlySummary(activities, month);

    // 先尝试 AI 生成详细计划
    let detailedDays = await generateDetailedExercisePlan(user, weightContext, monthlySummary, selectedTypes);

    // 如果 AI 失败，生成本地详细计划
    if (!detailedDays) {
      const typeNames = {
        outdoor_run: "户外跑步", walking: "健走", outdoor_cycle: "户外骑行",
        indoor_run: "室内跑步", jump_rope: "跳绳", swimming: "游泳",
        yoga: "瑜伽", strength: "力量训练", hiit: "HIIT间歇训练", badminton: "羽毛球"
      };
      const types = (selectedTypes && selectedTypes.length > 0) ? selectedTypes : ["outdoor_run", "walking"];
      const intensityLevel = user.activity_level === "high" ? 1.2 : user.activity_level === "low" ? 0.8 : 1.0;
      const bmi = user.weight / ((user.height / 100) * (user.height / 100));
      const isOverweight = bmi >= 24;

      detailedDays = [];
      for (let d = 1; d <= 30; d++) {
        const weekDay = d % 7;
        const type = types[(d - 1) % types.length];
        const typeName = typeNames[type] || "有氧运动";
        const isRecovery = weekDay === 0 || weekDay === 6;
        const isHigh = !isRecovery && (d % 3 === 0);
        let duration, calories;
        if (isRecovery) {
          duration = Math.round(15 + Math.random() * 10);
          calories = Math.round(duration * 5 * intensityLevel);
        } else if (isHigh) {
          duration = Math.round(30 + Math.random() * 15);
          calories = Math.round(duration * 8 * intensityLevel);
        } else {
          duration = Math.round(20 + Math.random() * 15);
          calories = Math.round(duration * 6.5 * intensityLevel);
        }
        if (isOverweight) calories = Math.round(calories * 1.1);
        const adviceList = [
          "保持均匀呼吸，注意节奏", "量力而行，循序渐进",
          "运动前后充分拉伸", "注意补充水分",
          "保持心率在燃脂区间", "关注身体反馈，避免过度训练"
        ];
        const advice = adviceList[Math.floor(Math.random() * adviceList.length)];
        detailedDays.push({
          day: d, type: typeName, duration, calories,
          isHighIntensity: isHigh,
          advice: isRecovery ? "恢复日：低强度活动，重点拉伸放松" : advice
        });
      }
    }

    res.json({ days: detailedDays });
  } catch (err) {
    console.error("生成详细运动计划失败:", err);
    res.status(500).json({ error: "生成详细运动计划失败" });
  }
});

// 获取当前计划
router.get("/active", requireAuth, async (req, res) => {
  try {
    const plan = await HealthPlan.findOne({
      where: { user_id: req.session.userId, is_active: true },
      order: [["generated_at", "DESC"]],
    });

    if (!plan) {
      return res.json({ plan: null });
    }

    res.json({
      plan: {
        id: plan.id,
        plan_type: plan.plan_type,
        plan_month: plan.plan_month,
        diet_plan: plan.diet_plan ? JSON.parse(plan.diet_plan) : null,
        exercise_plan: plan.exercise_plan ? JSON.parse(plan.exercise_plan) : null,
        plan_data: plan.plan_data ? JSON.parse(plan.plan_data) : null,
        summary: plan.plan_data ? JSON.parse(plan.plan_data).summary : null,
        generated_at: plan.generated_at,
      },
    });
  } catch (err) {
    console.error("获取计划失败:", err);
    res.status(500).json({ error: "获取计划失败" });
  }
});

// 获取所有历史计划
router.get("/history", requireAuth, async (req, res) => {
  try {
    const plans = await HealthPlan.findAll({
      where: { user_id: req.session.userId },
      order: [["generated_at", "DESC"]],
    });

    res.json({
      plans: plans.map((p) => ({
        id: p.id,
        plan_type: p.plan_type,
        plan_month: p.plan_month,
        summary: p.plan_data ? JSON.parse(p.plan_data).summary : null,
        generated_at: p.generated_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "获取历史计划失败" });
  }
});

module.exports = router;
