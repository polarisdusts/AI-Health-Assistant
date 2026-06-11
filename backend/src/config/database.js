//导入依赖加载环境变量
const { Sequelize } = require("sequelize"); //从包中取出sequelize类
require("dotenv").config(); //加载.env文件中的环境变量到process.env

const sequelize = new Sequelize(
  process.env.DB_NAME || "health_tracker",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  },
);

module.exports = sequelize;

//使用sequelize框架顶替了传统sql语句，无需手动处理，可以直接通过对象方法调用
