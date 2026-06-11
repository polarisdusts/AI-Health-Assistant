const sequelize = require("../config/database");
const User = require("./User");
const WeightRecord = require("./WeightRecord");
const ActivityRecord = require("./ActivityRecord");
const HealthPlan = require("./HealthPlan");

// Define associations
User.hasMany(WeightRecord, { foreignKey: "user_id", onDelete: "CASCADE" });
WeightRecord.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(ActivityRecord, { foreignKey: "user_id", onDelete: "CASCADE" });
ActivityRecord.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(HealthPlan, { foreignKey: "user_id", onDelete: "CASCADE" });
HealthPlan.belongsTo(User, { foreignKey: "user_id" });

module.exports = {
  sequelize,
  User,
  WeightRecord,
  ActivityRecord,
  HealthPlan,
};
