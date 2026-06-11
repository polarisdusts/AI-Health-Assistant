require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const sequelize = require("./config/database");
const { User } = require("./models");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: "sessions",
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000,
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "health_tracker_secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/weight", require("./routes/weight"));
app.use("/api/activity", require("./routes/activity"));
app.use("/api/plan", require("./routes/plan"));
app.use("/api/report", require("./routes/report"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "服务器内部错误" });
});

// Initialize database and start server
async function start() {
  try {
    await sequelize.authenticate();
    console.log("? 数据库连接成功");

    // Sync all models (in dev, use alter:true)
    await sequelize.sync({ alter: true });
    console.log("? 数据表同步完成");

    // Sync session store
    await sessionStore.sync();
    console.log("? Session存储同步完成");

    app.listen(PORT, () => {
      console.log(`? 服务器运行在 http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("? 启动失败:", err);
    process.exit(1);
  }
}

start();
