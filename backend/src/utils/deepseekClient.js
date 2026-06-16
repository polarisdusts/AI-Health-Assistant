/**
 * DeepSeek API 客户端
 * 使用原生 fetch() 调用 DeepSeek 大模型生成健康计划与运动建议
 * Node.js v22.11.0 原生支持 fetch
 */

const API_KEY = process.env.DEEPSEEK_API_KEY || "";
const BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const MODEL = "deepseek-chat";

/**
 * 发送请求到 DeepSeek API — 使用原生 fetch()
 */
async function callDeepSeek(messages, temperature = 0.7, maxTokens = 4096) {
  if (!API_KEY) {
    throw new Error("DEEPSEEK_API_KEY 未配置，请在 .env 文件中设置");
  }

  const url = `${BASE_URL}/v1/chat/completions`;
  const body = JSON.stringify({
    model: MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  });

  console.log("[DeepSeek] 发送请求, 消息数: " + messages.length);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + API_KEY,
    },
    body,
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "无法读取错误响应");
    throw new Error("DeepSeek API HTTP " + response.status + ": " + errorText.substring(0, 300));
  }

  const data = await response.json();

  if (data.error) {
    throw new Error("DeepSeek API 错误: " + (data.error.message || JSON.stringify(data.error)));
  }

  if (data.choices && data.choices.length > 0) {
    const content = data.choices[0].message.content;
    console.log("[DeepSeek] 响应成功，长度: " + content.length + " 字符");
    return content;
  }

  throw new Error("DeepSeek API 返回格式异常: 无 choices");
}

/**
 * 从 AI 返回文本中提取 JSON 对象或数组
 */
function extractJSON(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^`(?:json)?\s*/i, "").replace(/\s*`\s*$/i, "");
  cleaned = cleaned.trim();
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) return JSON.parse(objMatch[0]);
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrMatch) return JSON.parse(arrMatch[0]);
  return JSON.parse(cleaned);
}

/**
 * 生成月度饮食+运动计划摘要
 */
async function generateMonthlyPlan(user, weightContext, monthlySummary) {
  const { buildAIPrompt } = require("./promptBuilder");
  const prompt = buildAIPrompt(user, weightContext, monthlySummary);

  const systemPrompt = "你是一位专业的健康管理专家和AI营养师。\n请根据用户信息生成一个月的健康计划。\n必须以严格的 JSON 格式返回，不要包含 markdown 代码块标记，只返回纯 JSON 字符串。\nJSON 结构必须如下：\n{\n  \"diet_plan\": {\n    \"daily_calories\": \"建议数值(kcal)\",\n    \"meals\": { \"breakfast\": \"...\", \"lunch\": \"...\", \"dinner\": \"...\", \"snack\": \"...\" },\n    \"recommended_foods\": [\"...\"],\n    \"avoid_foods\": [\"...\"],\n    \"supplements\": [\"...\"]\n  },\n  \"exercise_plan\": {\n    \"weekly_frequency\": 数字,\n    \"recommended_types\": [\"...\"],\n    \"duration_per_session\": \"字符串\",\n    \"intensity\": \"字符串\",\n    \"progression\": \"字符串\"\n  },\n  \"summary\": \"一段50字内的总结建议\"\n}";

  const response = await callDeepSeek([
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ]);

  const parsed = extractJSON(response);
  if (!parsed.diet_plan || !parsed.exercise_plan) {
    throw new Error("API 返回缺少必要字段 diet_plan 或 exercise_plan");
  }
  if (!parsed.diet_plan.meals) {
    parsed.diet_plan.meals = { breakfast: "", lunch: "", dinner: "", snack: "" };
  }
  if (!parsed.diet_plan.recommended_foods) parsed.diet_plan.recommended_foods = [];
  if (!parsed.diet_plan.avoid_foods) parsed.diet_plan.avoid_foods = [];
  if (!parsed.exercise_plan.recommended_types) parsed.exercise_plan.recommended_types = [];
  return parsed;
}

/**
 * 生成每日运动建议
 */
async function generateDailySuggestion(user, recentActivities) {
  const activityCount = recentActivities?.length || 0;
  const totalCalories = recentActivities?.reduce((s, a) => s + (a.calories_burned || 0), 0) || 0;

  const prompt = "用户本月已运动" + activityCount + "次，消耗" + totalCalories + "千卡。\n请根据这些数据给出今日的运动建议，以 JSON 格式返回：\n{ \"suggestion\": \"...\", \"recommendedToday\": \"...\" }";

  const response = await callDeepSeek(
    [
      { role: "system", content: "你是健康运动教练，给出简短实用的运动建议。" },
      { role: "user", content: prompt },
    ],
    0.5,
    512
  );

  const parsed = extractJSON(response);
  if (!parsed.suggestion) {
    throw new Error("返回缺少 suggestion 字段");
  }
  return parsed;
}

/**
 * 生成月度报告
 */
async function generateMonthlyReport(activities, month) {
  const totalCalories = activities.reduce((s, a) => s + (a.calories_burned || 0), 0);
  const totalSteps = activities.reduce((s, a) => s + (a.steps_estimated || 0), 0);
  const totalActivities = activities.length;
  const sessionDays = new Set(activities.map((a) => a.record_date)).size;

  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const dailyAvgCalories = daysInMonth > 0 ? totalCalories / daysInMonth : 0;
  const dailyAvgSteps = daysInMonth > 0 ? totalSteps / daysInMonth : 0;

  const calorieScore = Math.min((dailyAvgCalories / 600) * 40, 40);
  const stepScore = Math.min((dailyAvgSteps / 6000) * 30, 30);
  const activityScore = Math.min((totalActivities / (daysInMonth * 2)) * 30, 30);
  const healthScore = Math.round(calorieScore + stepScore + activityScore);

  let intensityLevel = "新手";
  if (healthScore >= 30) intensityLevel = "活力提升区";
  if (healthScore >= 50) intensityLevel = "优秀燃脂区";
  if (healthScore >= 70) intensityLevel = "进阶强化区";
  if (healthScore >= 85) intensityLevel = "卓越巅峰区";

  let exerciseSummary = "本月运动" + totalActivities + "次，总消耗" + Math.round(totalCalories) + "千卡，运动天数" + sessionDays + "天。";
  let sleepSummary = "本周你的睡眠片段零碎，请注意合理安排作息，建议固定作息时间并减少睡前使用电子设备。";

  if (activities.length > 0) {
    try {
      const prompt = "用户本月运动数据：运动" + totalActivities + "次，总消耗" + Math.round(totalCalories) + "千卡，总步数" + totalSteps + "步，运动天数" + sessionDays + "天。\n请生成一份简短的月度运动评价和睡眠建议，以 JSON 格式返回：\n{ \"exerciseSummary\": \"...\", \"sleepSummary\": \"...\" }";
      const response = await callDeepSeek(
        [
          { role: "system", content: "你是健康数据分析师，给出专业的月度健康评价。" },
          { role: "user", content: prompt },
        ],
        0.5,
        512
      );
      const aiSummary = extractJSON(response);
      if (aiSummary.exerciseSummary) exerciseSummary = aiSummary.exerciseSummary;
      if (aiSummary.sleepSummary) sleepSummary = aiSummary.sleepSummary;
    } catch (err) {
      console.warn("DeepSeek 月度报告 AI 评价失败，使用本地评价:", err.message);
    }
  }

  const uniqueDays = [...new Set(activities.map((a) => a.record_date))];
  const qualifiedDays = uniqueDays.filter((date) => {
    const dayActs = activities.filter((a) => a.record_date === date);
    const daySteps = dayActs.reduce((s, a) => s + (a.steps_estimated || 0), 0);
    const dayCal = dayActs.reduce((s, a) => s + (a.calories_burned || 0), 0);
    return daySteps >= 6000 || dayCal >= 600;
  }).length;

  return {
    month,
    totalCalories: Math.round(totalCalories),
    totalSteps,
    totalActivities,
    sessionDays,
    dailyAvgCalories: Math.round(dailyAvgCalories),
    dailyAvgSteps: Math.round(dailyAvgSteps),
    dailyAvgDuration: Math.round(dailyAvgCalories / 5) + "分钟",
    qualifiedDays,
    healthScore,
    intensityLevel,
    exerciseSummary,
    sleepSummary,
    nextMonthSuggestion: {
      adjustUp: "上调标准：增加运动频率至每周5次，提高每日目标至7000步/800千卡",
      maintain: "保持标准：维持当前运动频率，可适当增加运动强度",
      adjustDown: "下调标准：减少运动量至每周2-3次，以恢复为主",
    },
  };
}

/**
 * 生成30天详细每日运动计划
 */
async function generateDetailedExercisePlan(user, weightContext, monthlySummary, selectedTypes) {
  const typeNames = (selectedTypes || [])
    .map((t) => {
      const map = {
        outdoor_run: "户外跑步", walking: "健走", outdoor_cycle: "户外骑行",
        indoor_run: "室内跑步", jump_rope: "跳绳", swimming: "游泳",
        yoga: "瑜伽", strength: "力量训练", hiit: "HIIT间歇训练", badminton: "羽毛球",
      };
      return map[t] || t;
    })
    .join("、");

  const bmi = user.weight / ((user.height / 100) * (user.height / 100));
  const ageGroup = user.age < 18 ? "青少年" : user.age < 40 ? "青壮年" : user.age < 60 ? "中年" : "老年";
  const activityLabel = user.activity_level === "low" ? "低活动量" : user.activity_level === "medium" ? "中等活动量" : "高活动量";

  const prompt = "作为专业健身教练，请为以下用户生成一份30天的每日运动计划。\n\n用户信息：" + ageGroup + "，" + activityLabel + "，BMI " + bmi.toFixed(1) + "\n选择的运动类型：" + typeNames + "\n" + (monthlySummary?.summary ? "本月概况：" + monthlySummary.summary : "") + "\n" + weightContext + "\n\n要求：\n1. 输出严格的JSON数组，每个元素代表一天的安排\n2. 每天包含：运动类型、时长(分钟)、消耗(千卡)、是否高强度(true/false)、运动建议\n3. 每周安排1-2天恢复日（低强度）\n4. 根据用户活动水平调整强度\n5. 30天计划要多样化，循环使用所选运动类型\n\n输出格式：[{ \"day\": 1, \"type\": \"户外跑步\", \"duration\": 30, \"calories\": 250, \"isHighIntensity\": true, \"advice\": \"...\" }, ...]\n\n只返回JSON数组，不要其他文字。";

  const response = await callDeepSeek(
    [
      { role: "system", content: "你是一名专业健身教练，每次只返回JSON数据。" },
      { role: "user", content: prompt },
    ],
    0.5,
    4096
  );

  const days = extractJSON(response);
  if (!Array.isArray(days)) {
    throw new Error("API 返回的不是数组格式");
  }
  if (days.length < 28) {
    throw new Error("返回天数不足28天，实际: " + days.length);
  }
  return days;
}


/**
 * 生成30天详细每日饮食计划（基于用户身体状况、目标和饮食偏好）
 */
async function generateDetailedDietPlan(user, dietGoal, weightContext) {
  const bmi = user.weight / ((user.height / 100) * (user.height / 100));
  const ageGroup = user.age < 18 ? "青少年" : user.age < 40 ? "青壮年" : user.age < 60 ? "中年" : "老年";
  const dietLabel = user.diet_preference === "vegetarian" ? "素食" : user.diet_preference === "high_protein" ? "高蛋白" : "均衡";

  const goalLabels = {
    sugar_control: "控糖", fat_loss: "减脂", muscle_gain: "增肌",
    weight_gain: "增重", weight_loss: "减肥", maintain: "维持现状"
  };
  const goalLabel = goalLabels[dietGoal] || "健康饮食";

  const prompt = "作为专业营养师和健康饮食专家，请为以下用户生成一份30天的详细每日饮食计划。\n\n用户信息：" + ageGroup + "，" + dietLabel + "饮食，BMI " + bmi.toFixed(1) + "，体重" + user.weight + "kg\n饮食目标：" + goalLabel + "\n" + (weightContext || "") + "\n\n要求：\n1. 输出严格的JSON数组，每个元素代表一天的饮食安排\n2. 每天包含：早餐、午餐、晚餐、加餐的食物名称、热量(kcal)、蛋白质(g)、碳水(g)、脂肪(g)\n3. 根据用户饮食习惯和目标调整\n4. 每天的总热量要与目标匹配\n5. 每周安排1天轻断食或清淡饮食\n\n输出格式：[\n  {\n    \"day\": 1,\n    \"breakfast\": { \"food\": \"...\", \"cal\": 350, \"protein\": 15, \"carbs\": 45, \"fat\": 10 },\n    \"lunch\": { \"food\": \"...\", \"cal\": 550, \"protein\": 30, \"carbs\": 55, \"fat\": 15 },\n    \"dinner\": { \"food\": \"...\", \"cal\": 400, \"protein\": 25, \"carbs\": 35, \"fat\": 12 },\n    \"snack\": { \"food\": \"...\", \"cal\": 150, \"protein\": 8, \"carbs\": 20, \"fat\": 5 },\n    \"aiAdvice\": \"当天的饮食建议\"\n  },\n  ...\n]\n\n只返回JSON数组，不要其他文字。";

  const response = await callDeepSeek(
    [
      { role: "system", content: "你是一名专业营养师，每次只返回JSON数据。" },
      { role: "user", content: prompt },
    ],
    0.5,
    4096
  );

  const days = extractJSON(response);
  if (!Array.isArray(days)) {
    throw new Error("API 返回的不是数组格式");
  }
  if (days.length < 28) {
    throw new Error("返回天数不足28天，实际: " + days.length);
  }
  return days;
}

/**
 * 生成单次运动 AI 分析报告
 */
async function generateActivityAnalysis(user, activityData) {
  const bmi = user.weight ? (user.weight / ((user.height / 100) * (user.height / 100))).toFixed(1) : "未知";
  const age = user.age || "未知";
  const gender = user.gender === "male" ? "男" : user.gender === "female" ? "女" : "其他";
  const activityLabel = user.activity_level === "low" ? "低" : user.activity_level === "medium" ? "中" : "高";
  const prompt = "你是一名专业运动健康顾问。请根据以下用户信息和本次运动数据，给出专业的运动分析报告（200字以内）。\n\n【用户信息】年龄:" + age + "岁 性别:" + gender + " BMI:" + bmi + " 活动水平:" + activityLabel + "\n【运动数据】类型:" + (activityData.typeName||"运动") + " 时长:" + activityData.duration + "分钟 消耗:" + activityData.calories + "千卡 步数:" + (activityData.steps||0) + " 心率:" + (activityData.avgHeartRate||0) + "bpm 步频:" + (activityData.cadence||0) + "步/分 强度:" + (activityData.isMV?"中高强度":"低强度") + " 评分:" + (activityData.score||0) + "/100\n\n请评价本次运动表现、心肺燃脂效果，并给出优化建议和下次运动调整建议。";
  const response = await callDeepSeek([{role:"system",content:"你是一名专业运动健康顾问，回答简洁专业，使用中文。"},{role:"user",content:prompt}],0.5,1024);
  return response;
}

module.exports = {
  generateActivityAnalysis,
  generateMonthlyPlan,
  generateDailySuggestion,
  generateMonthlyReport,
  generateDetailedExercisePlan,
  generateDetailedDietPlan,
  callDeepSeek,
};


