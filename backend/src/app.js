process.on("unhandledRejection", (reason) => { console.error("UNHANDLED REJECTION:", reason?.message || reason); });
require("dotenv").config();
//function require(id){}模块加载函数，id为模块标识符，返回一任意类型的模块导出内容
//require函数解析路径查找所需的模块，创建模块对象执行模块代码，每一模块代码被包裹在函数中
const express = require("express");
const cors = require("cors");
const session = require("express-session"); //session管理
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const sequelize = require("./config/database"); //数据库连接实例
const { User } = require("./models");

const app = express(); //创建对象
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true, //Cookie
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
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
  }),
);

//中间件挂载，使用use函数可以匹配所有的HTTP方法（GET,POST,PUT,DELETE...)
app.use("/api/auth", require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/weight", require("./routes/weight"));
app.use("/api/activity", require("./routes/activity"));
app.use("/api/plan", require("./routes/plan"));
app.use("/api/device", require("./routes/device"));
app.use("/api/report", require("./routes/report"));
//使用get函数只能匹配GET方法，保证数据处理规范
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

//错误处理
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message, err.stack?.substring(0,500));
  res.status(500).json({ error: "服务器内部错误" });
});

//启动流程
async function start() {
  try {
    await sequelize.authenticate();
    console.log("数据库连接成功");
    await sequelize.sync();
    console.log("数据表同步完成");
    await sessionStore.sync();
    console.log("Session存储同步完成");
    function tryListen(port) {
      const server = app.listen(port, () => {
        console.log("服务器运行在 http://localhost:" + port);
      });
      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error("端口 " + port + " 被占用, 尝试端口 " + (port+1));
          tryListen(port + 1);
        } else {
          console.error("启动失败:", err);
          process.exit(1);
        }
      });
    }
    tryListen(PORT);
  } catch (err) {
    console.error("启动失败:", err);
    process.exit(1);
  }
}

start();
