# ?? 智康AI - 智能健康管理系统

基于 Vue 3 + Node.js/Express + MySQL 的 AI 驱动健康管理 Web 应用。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Vue Router + Pinia + Chart.js |
| 后端 | Node.js + Express.js + Sequelize ORM |
| 数据库 | MySQL |
| 认证 | Session + Cookie (express-session) |
| AI | DeepSeek API (当前使用 Mock 数据) |

## 项目结构

```
health-tracker/
├── backend/
│   ├── src/
│   │   ├── config/database.js    # 数据库配置
│   │   ├── models/               # Sequelize 模型
│   │   ├── routes/               # API 路由
│   │   ├── middleware/auth.js    # 认证中间件
│   │   ├── utils/                # 工具函数
│   │   │   ├── mockAI.js         # 模拟 AI 响应
│   │   │   ├── promptBuilder.js  # 提示词构建
│   │   └── app.js                # 入口文件
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── views/                # 页面视图
│   │   ├── components/           # 可复用组件
│   │   ├── store/                # Pinia 状态管理
│   │   ├── router/               # 路由配置
│   │   ├── api/                  # API 封装
│   │   └── assets/               # 样式资源
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 快速开始

### 前置要求

- Node.js >= 18
- MySQL >= 5.7
- npm >= 8

### 1. 数据库配置

创建 MySQL 数据库：
```sql
CREATE DATABASE health_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 后端配置

```bash
cd backend
cp .env .env.local   # 修改数据库连接信息
```

编辑 `.env.local`（或直接修改 `.env`）：
```
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=health_tracker
DB_USER=root
DB_PASSWORD=your_mysql_password
SESSION_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:5173
```

安装依赖并启动：
```bash
npm install
npm run dev
```

### 3. 前端配置

```bash
cd frontend
npm install
npm run dev
```

### 4. 访问应用

- 前端: http://localhost:5173
- 后端 API: http://localhost:3001/api
- 健康检查: http://localhost:3001/api/health

## 核心功能

### ?? 仪表盘
- 卡路里、步数、活动次数三项核心指标（圆形进度环）
- Chart.js 图表（饼状/环形/柱状三种模式）
- 中高强度活动次数统计
- 活动记录卡片列表（同类型堆叠显示）

### ?? 运动界面
- 运动类型选择（跑步/健走/骑行/跳绳等）
- AI 分析生成单次运动建议
- 结束运动自动生成指标（时长/消耗/步数/心率）
- 数据自动同步到仪表盘

### ?? 月度报告
- 健康指数评分（0-100）
- 运动强度评级（新手/活力提升区/优秀燃脂区等）
- 日均指标统计
- 达标天数计算
- 运动与睡眠评价
- 下月计划调整建议

### ?? 体重追踪
- 每日体重记录
- 历史趋势可视化
- 自动构建体重变化上下文
- 跨月趋势分析传递给 AI

### ?? AI 计划生成
- 基于用户档案生成饮食与运动计划
- 历史体重趋势作为上下文
- 月度计划自动优化调整
- 当前使用 Mock 数据，可切换 DeepSeek API

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/logout | 登出 |
| GET | /api/auth/me | 获取当前用户 |
| GET | /api/profile | 获取健康档案 |
| PUT | /api/profile | 更新健康档案 |
| POST | /api/weight | 记录体重 |
| GET | /api/weight | 获取体重历史 |
| POST | /api/activity | 记录运动 |
| GET | /api/activity | 获取运动记录 |
| GET | /api/activity/types | 运动类型列表 |
| POST | /api/plan/generate-monthly | 生成月度计划 |
| GET | /api/plan/active | 当前活跃计划 |
| GET | /api/plan/history | 历史计划 |
| GET | /api/report/monthly/:month | 月度报告 |
| GET | /api/report/current-summary | 当前汇总数据 |

## 切换至真实 DeepSeek API

编辑 `backend/src/utils/mockAI.js`，参考其中的数据结构，替换为：

```javascript
const axios = require("axios");

async function callDeepSeekAPI(prompt) {
  const response = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "你是健康管理专家..." },
        { role: "user", content: prompt },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
    }
  );
  return JSON.parse(response.data.choices[0].message.content);
}
```
