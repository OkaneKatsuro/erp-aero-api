import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

class User extends Model {
    public id!: number;
    public email!: string;
    public password!: string;
    public refreshToken!: string | null;
}

User.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        refreshToken: { type: DataTypes.STRING, allowNull: true },
    },
    {
        sequelize,
        tableName: "users",
        timestamps: false,
    }
);

export default User;
