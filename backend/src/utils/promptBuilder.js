/**
 * 构建体重趋势分析的文本描述，用于传递给 LLM 作为上下文
 */
function buildWeightTrendContext(weightRecords) {
  if (!weightRecords || weightRecords.length < 2) {
    return "暂无足够的体重记录数据用于趋势分析。";
  }

  // 按日期排序
  const sorted = [...weightRecords].sort(
    (a, b) => new Date(a.record_date) - new Date(b.record_date)
  );

  // 按月份分组
  const monthlyGroups = {};
  sorted.forEach((r) => {
    const month = r.record_date.substring(0, 7);
    if (!monthlyGroups[month]) monthlyGroups[month] = [];
    monthlyGroups[month].push(r.weight);
  });

  // 计算每月平均体重
  const monthlyAvgs = Object.entries(monthlyGroups)
    .map(([month, weights]) => ({
      month,
      avgWeight:
        weights.reduce((s, w) => s + w, 0) / weights.length,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  if (monthlyAvgs.length < 2) {
    return `当前月份平均体重：${monthlyAvgs[0]?.avgWeight.toFixed(1)}kg，仅有本月份数据，建议继续记录。`;
  }

  const last = monthlyAvgs[monthlyAvgs.length - 1];
  const prev = monthlyAvgs[monthlyAvgs.length - 2];
  const diff = prev.avgWeight - last.avgWeight;
  const diffPercent = (diff / prev.avgWeight) * 100;

  let trendDesc = "";
  if (diffPercent >= 2) {
    trendDesc = "体重呈明显下降趋势，继续保持！";
  } else if (diffPercent >= 0.5) {
    trendDesc = "体重缓慢下降，可适当增加蛋白质摄入。";
  } else if (diffPercent > -0.5) {
    trendDesc = "体重保持稳定，建议微调运动强度。";
  } else if (diffPercent >= -1) {
    trendDesc = "体重轻微上升，建议控制碳水摄入并增加有氧运动。";
  } else {
    trendDesc = "体重明显上升，建议减少热量摄入并增加运动量。";
  }

  const records = monthlyAvgs
    .map(
      (m) =>
        `${m.month}：平均体重 ${m.avgWeight.toFixed(1)}kg`
    )
    .join(" → ");

  return (
    `用户过去 ${monthlyAvgs.length} 个月的体重变化：${records}\n` +
    `变化幅度：${diffPercent >= 0 ? "下降" : "上升"}${Math.abs(diffPercent).toFixed(1)}%（${Math.abs(diff).toFixed(1)}kg）\n` +
    `趋势判定：${trendDesc}`
  );
}

/**
 * 构建月度报告摘要用于计划优化
 */
function buildMonthlySummary(activities, month) {
  const totalCalories = activities.reduce((s, a) => s + (a.calories_burned || 0), 0);
  const totalSteps = activities.reduce((s, a) => s + (a.steps_estimated || 0), 0);
  const totalActivities = activities.length;
  const sessionDays = new Set(activities.map((a) => a.record_date)).size;

  // 计算日均值
  const daysInMonth = new Date(
    parseInt(month.split("-")[0]),
    parseInt(month.split("-")[1]),
    0
  ).getDate();
  const dailyAvgCalories = daysInMonth > 0 ? (totalCalories / daysInMonth).toFixed(0) : 0;
  const dailyAvgSteps = daysInMonth > 0 ? (totalSteps / daysInMonth).toFixed(0) : 0;

  return {
    totalCalories,
    totalSteps,
    totalActivities,
    sessionDays,
    dailyAvgCalories: parseFloat(dailyAvgCalories),
    dailyAvgSteps: parseFloat(dailyAvgSteps),
    summary: `本月运动${totalActivities}次，总消耗${totalCalories}千卡，运动天数${sessionDays}天。`,
  };
}

/**
 * 构建发送给AI的完整提示词
 */
function buildAIPrompt(user, weightContext, monthlySummary) {
  const ageGroup =
    user.age < 18
      ? "青少年"
      : user.age < 40
      ? "青壮年"
      : user.age < 60
      ? "中年"
      : "老年";

  const genderLabel =
    user.gender === "male" ? "男性" : user.gender === "female" ? "女性" : "其他";

  const activityLabel =
    user.activity_level === "low"
      ? "低活动量"
      : user.activity_level === "medium"
      ? "中等活动量"
      : "高活动量";

  const dietLabel =
    user.diet_preference === "vegetarian"
      ? "素食"
      : user.diet_preference === "high_protein"
      ? "高蛋白"
      : "均衡饮食";

  return `
【健康计划生成任务】

## 用户基本信息
- 年龄：${user.age}岁（${ageGroup}）
- 性别：${genderLabel}
- 身高：${user.height}cm
- 体重：${user.weight}kg
- BMI：${(user.weight / ((user.height / 100) * (user.height / 100))).toFixed(1)}
- 活动水平：${activityLabel}
- 饮食偏好：${dietLabel}
- 健康目标：${user.health_goal || "未设定"}

## 体重历史趋势
${weightContext}

## 本月运动概况
${monthlySummary?.summary || "暂无本月运动数据"}

## 任务要求
请根据以上用户信息，生成一份为期一个月的个性化饮食与运动计划，要求：

### 饮食计划
1. 每日热量摄入建议
2. 三餐分配比例
3. 推荐食物清单
4. 需要避免的食物
5. 营养补充建议

### 运动计划
1. 每周运动频率建议
2. 运动类型推荐（结合用户偏好和活动水平）
3. 每次运动时长建议
4. 运动强度指导
5. 渐进式提升方案

请以JSON格式输出，包含以下结构：
{
  "diet_plan": { "daily_calories": ..., "meals": {...}, "recommended_foods": [...], "avoid_foods": [...], "supplements": [...] },
  "exercise_plan": { "weekly_frequency": ..., "recommended_types": [...], "duration_per_session": ..., "intensity": "...", "progression": "..." },
  "summary": "一段总结性建议"
}
`;
}

module.exports = {
  buildWeightTrendContext,
  buildMonthlySummary,
  buildAIPrompt,
};
