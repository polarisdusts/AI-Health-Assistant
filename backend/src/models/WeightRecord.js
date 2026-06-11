const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const WeightRecord = sequelize.define("WeightRecord", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: "体重(kg)",
  },
  record_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: "记录日期",
  },
  note: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "备注",
  },
});

module.exports = WeightRecord;
