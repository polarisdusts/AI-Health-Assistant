/**
 * 模拟 AI 响应
 * 后期替换为真实 DeepSeek API 调用
 */

function generateMockMonthlyPlan(user) {
  const bmi = user.weight / ((user.height / 100) * (user.height / 100));
  const isOverweight = bmi >= 24;
  const isUnderweight = bmi < 18.5;

  const calories = isOverweight
    ? "1600-1800"
    : isUnderweight
      ? "2200-2500"
      : "1800-2000";

  const exerciseFocus =
    user.diet_preference === "high_protein" ? "力量训练为主" : "有氧运动为主";

  return {
    diet_plan: {
      daily_calories: calories,
      meals: {
        breakfast: "全麦面包+鸡蛋+牛奶+水果",
        lunch: "杂粮饭+瘦肉/鱼+蔬菜+豆制品",
        dinner: "蔬菜沙拉+鸡胸肉/豆腐+少量主食",
        snack: "坚果或酸奶",
      },
      recommended_foods: [
        "粗粮杂豆",
        "优质蛋白(鸡胸肉/鱼/虾/豆腐)",
        "蔬菜(深色蔬菜为主)",
        "当季水果",
        "坚果适量",
      ],
      avoid_foods: ["高糖饮料和零食", "油炸食品", "过度加工食品", "含糖糕点"],
      supplements: ["复合维生素", "蛋白粉(运动后)"],
    },
    exercise_plan: {
      weekly_frequency:
        user.activity_level === "high"
          ? 5
          : user.activity_level === "medium"
            ? 3
            : 2,
      recommended_types: [
        exerciseFocus,
        user.gender === "male" ? "跑步+俯卧撑" : "瑜伽+慢跑",
        "HIIT间歇训练",
      ],
      duration_per_session: `${user.activity_level === "low" ? "20-30" : "30-45"}分钟`,
      intensity:
        user.activity_level === "low" ? "低强度起步，逐步适应" : "中高强度交替",
      progression: "每周增加5%的运动量，逐步提升耐力",
    },
    summary: `根据您的身体指标(BMI:${bmi.toFixed(1)})，建议每日摄入${calories}千卡，每周运动${user.activity_level === "high" ? 5 : user.activity_level === "medium" ? 3 : 2}次。${exerciseFocus}，配合合理的饮食结构调整，坚持下去会有显著改善！`,
  };
}

function generateMockDailySuggestion(user, recentActivities) {
  const activityCount = recentActivities?.length || 0;
  const totalCalories =
    recentActivities?.reduce((s, a) => s + (a.calories_burned || 0), 0) || 0;

  let suggestion;
  if (activityCount < 3) {
    suggestion =
      "您本月运动次数较少，建议从温和的有氧运动开始，如快走20分钟，逐步建立运动习惯。";
  } else if (activityCount < 8) {
    suggestion =
      "您的运动频率适中，可以尝试增加一些中高强度间歇训练，提升燃脂效率。";
  } else {
    suggestion =
      "您的运动习惯良好！建议挑战进阶训练，如长距离跑步或高强度力量训练。";
  }

  return {
    suggestion,
    activityCount,
    totalCalories,
    recommendedToday:
      activityCount < 3
        ? "快走/散步"
        : activityCount < 8
          ? "跑步/骑行"
          : "HIIT训练",
  };
}

function generateMockMonthlyReport(activities, month) {
  const totalCalories = activities.reduce(
    (s, a) => s + (a.calories_burned || 0),
    0,
  );
  const totalSteps = activities.reduce(
    (s, a) => s + (a.steps_estimated || 0),
    0,
  );
  const totalActivities = activities.length;
  const sessionDays = new Set(activities.map((a) => a.record_date)).size;

  const daysInMonth = new Date(
    parseInt(month.split("-")[0]),
    parseInt(month.split("-")[1]),
    0,
  ).getDate();

  // 计算qualifiedDays（步数>=6000 或 卡路里>=600）
  const qualifiedDays = activities.reduce((count, a) => {
    const date = a.record_date;
    const dayActivities = activities.filter((act) => act.record_date === date);
    const daySteps = dayActivities.reduce(
      (s, act) => s + (act.steps_estimated || 0),
      0,
    );
    const dayCal = dayActivities.reduce(
      (s, act) => s + (act.calories_burned || 0),
      0,
    );
    return daySteps >= 6000 || dayCal >= 600 ? count + 1 : count;
  }, 0);

  const dailyAvgCalories = daysInMonth > 0 ? totalCalories / daysInMonth : 0;
  const dailyAvgSteps = daysInMonth > 0 ? totalSteps / daysInMonth : 0;

  // 健康指数评分
  const calorieScore = Math.min((dailyAvgCalories / 600) * 40, 40);
  const stepScore = Math.min((dailyAvgSteps / 6000) * 30, 30);
  const activityScore = Math.min(
    (totalActivities / (daysInMonth * 2)) * 30,
    30,
  );
  const healthScore = Math.round(calorieScore + stepScore + activityScore);

  // 运动强度评级
  let intensityLevel;
  if (healthScore < 30) intensityLevel = "新手";
  else if (healthScore < 50) intensityLevel = "活力提升区";
  else if (healthScore < 70) intensityLevel = "优秀燃脂区";
  else if (healthScore < 85) intensityLevel = "进阶强化区";
  else intensityLevel = "卓越巅峰区";

  return {
    month,
    totalCalories: Math.round(totalCalories),
    totalSteps,
    totalActivities,
    sessionDays,
    dailyAvgCalories: Math.round(dailyAvgCalories),
    dailyAvgSteps: Math.round(dailyAvgSteps),
    dailyAvgDuration: `${Math.round(dailyAvgCalories / 5)}分钟`,
    qualifiedDays,
    healthScore,
    intensityLevel,
    exerciseSummary: `本月运动${totalActivities}次，总消耗${Math.round(totalCalories)}千卡，运动天数${sessionDays}天。`,
    sleepSummary:
      "本周你的睡眠片段零碎，请注意合理安排作息，建议固定作息时间并减少睡前使用电子设备。",
    nextMonthSuggestion: {
      adjustUp: "上调标准：增加运动频率至每周5次，提高每日目标至7000步/800千卡",
      maintain: "保持标准：维持当前运动频率，可适当增加运动强度",
      adjustDown: "下调标准：减少运动量至每周2-3次，以恢复为主",
    },
  };
}

module.exports = {
  generateMockMonthlyPlan,
  generateMockDailySuggestion,
  generateMockMonthlyReport,
};
