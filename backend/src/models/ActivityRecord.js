const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ActivityRecord = sequelize.define("ActivityRecord", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  activity_type: {
    type: DataTypes.ENUM(
      "outdoor_run",
      "walking",
      "outdoor_cycle",
      "indoor_run",
      "jump_rope",
      "swimming",
      "yoga",
      "strength",
      "other"
    ),
    allowNull: false,
  },
  activity_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "运动时长(分钟)",
  },
  distance: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: "距离(公里)",
  },
  calories_burned: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: "消耗卡路里",
  },
  steps_estimated: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "估算步数",
  },
  is_moderate_vigorous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "是否为中高强度",
  },
  avg_heart_rate: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "平均心率",
  },
  record_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
});

module.exports = ActivityRecord;
