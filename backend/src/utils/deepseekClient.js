/**
 * DeepSeek API 客户端
 * 调用 DeepSeek 大模型生成健康计划与运动建议
 */
const https = require("https");
const http = require("http");

const API_KEY = process.env.DEEPSEEK_API_KEY || "";
const BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const MODEL = "deepseek-chat";

/**
 * 发送请求到 DeepSeek API
 */
function callDeepSeek(messages, temperature = 0.7, maxTokens = 4096) {
  return new Promise((resolve, reject) => {
    if (!API_KEY) {
      return reject(new Error("DEEPSEEK_API_KEY 未配置"));
    }

    const urlObj = new URL(`${BASE_URL}/v1/chat/completions`);
    const isHttps = urlObj.protocol === "https:";
    const transport = isHttps ? https : http;

    const body = JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    });

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 30000,
    };

    const req = transport.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(`DeepSeek API 错误: ${parsed.error.message || JSON.stringify(parsed.error)}`));
          } else if (parsed.choices && parsed.choices.length > 0) {
            resolve(parsed.choices[0].message.content);
          } else {
            reject(new Error("DeepSeek API 返回格式异常"));
          }
        } catch (e) {
          reject(new Error(`解析响应失败: ${e.message}, 原始响应: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on("error", (e) => reject(new Error(`请求失败: ${e.message}`)));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("请求超时"));
    });

    req.write(body);
    req.end();
  });
}

/**
 * 统一 AI 调用入口：优先调真实 API，失败则回退到 mock
 */
const { generateMockMonthlyPlan, generateMockDailySuggestion, generateMockMonthlyReport } = require("./mockAI");

async function generateMonthlyPlan(user, weightContext, monthlySummary) {
  // 先尝试真实 API
  if (API_KEY) {
    try {
      const { buildAIPrompt } = require("./promptBuilder");
      const prompt = buildAIPrompt(user, weightContext, monthlySummary);

      const systemPrompt = `你是一位专业的健康管理专家和AI营养师。
请根据用户信息生成一个月的健康计划。
必须以严格的 JSON 格式返回，不要包含 markdown 代码块标记，只返回纯 JSON 字符串。
JSON 结构必须如下：
{
  "diet_plan": {
    "daily_calories": "建议数值(kcal)",
    "meals": { "breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..." },
    "recommended_foods": ["..."],
    "avoid_foods": ["..."],
    "supplements": ["..."]
  },
  "exercise_plan": {
    "weekly_frequency": 数字,
    "recommended_types": ["..."],
    "duration_per_session": "字符串",
    "intensity": "字符串",
    "progression": "字符串"
  },
  "summary": "一段50字内的总结建议"
}`;

      const response = await callDeepSeek([
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ]);

      // 清洗响应：移除可能的 markdown 代码块标记
      let cleaned = response.trim();
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      return JSON.parse(cleaned);
    } catch (err) {
      console.warn("DeepSeek API 调用失败，回退到 mock:", err.message);
    }
  }

  // 回退到 mock
  return generateMockMonthlyPlan(user);
}

async function generateDailySuggestion(user, recentActivities) {
  if (API_KEY) {
    try {
      const activityCount = recentActivities?.length || 0;
      const totalCalories = recentActivities?.reduce((s, a) => s + (a.calories_burned || 0), 0) || 0;

      const prompt = `用户本月已运动${activityCount}次，消耗${totalCalories}千卡。
请根据这些数据，给出今日运动建议（一句话），以及推荐的运动类型。
以 JSON 格式返回：{ "suggestion": "...", "recommendedToday": "..." }`;

      const response = await callDeepSeek(
        [
          { role: "system", content: "你是健康运动教练，给出简短实用的运动建议。" },
          { role: "user", content: prompt },
        ],
        0.5,
        512
      );

      let cleaned = response.trim();
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      return JSON.parse(cleaned);
    } catch (err) {
      console.warn("DeepSeek 每日建议失败，回退 mock:", err.message);
    }
  }
  return generateMockDailySuggestion(user, recentActivities);
}

async function generateMonthlyReport(activities, month) {
  if (API_KEY && activities.length > 0) {
    try {
      const totalCalories = activities.reduce((s, a) => s + (a.calories_burned || 0), 0);
      const totalSteps = activities.reduce((s, a) => s + (a.steps_estimated || 0), 0);
      const totalActivities = activities.length;
      const sessionDays = new Set(activities.map((a) => a.record_date)).size;

      const prompt = `用户本月运动数据：运动${totalActivities}次，总消耗${Math.round(totalCalories)}千卡，总步数${totalSteps}步，运动天数${sessionDays}天。
请生成一份简短的月度运动评价和睡眠建议，以 JSON 格式返回：
{ "exerciseSummary": "...", "sleepSummary": "..." }`;

      const response = await callDeepSeek(
        [
          { role: "system", content: "你是健康数据分析师，给出专业的月度健康评价。" },
          { role: "user", content: prompt },
        ],
        0.5,
        512
      );

      let cleaned = response.trim();
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      const aiSummary = JSON.parse(cleaned);
      const mockReport = generateMockMonthlyReport(activities, month);
      return { ...mockReport, ...aiSummary };
    } catch (err) {
      console.warn("DeepSeek 月度报告失败，回退 mock:", err.message);
    }
  }
  return generateMockMonthlyReport(activities, month);
}

module.exports = {
  generateMonthlyPlan,
  generateDailySuggestion,
  generateMonthlyReport,
  callDeepSeek,
};
