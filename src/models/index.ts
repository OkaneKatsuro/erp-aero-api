import sequelize from "../config/db";
import User from "./User";
import File from "./File";

User.hasMany(File, { foreignKey: "userId" });
File.belongsTo(User, { foreignKey: "userId" });

const initModels = async () => {
    await sequelize.sync({ alter: true });
    console.log(" Все таблицы синхронизированы");
};

export { User, File, initModels };
