import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";
import User from "./User";

class File extends Model {
    public id!: number;
    public userId!: number;
    public name!: string;
    public extension!: string;
    public mimeType!: string;
    public size!: number;
    public uploadDate!: Date;
    public filePath!: string;
}

File.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: User, key: "id" },
        },
        name: { type: DataTypes.STRING, allowNull: false },
        extension: { type: DataTypes.STRING, allowNull: false },
        mimeType: { type: DataTypes.STRING, allowNull: false },
        size: { type: DataTypes.INTEGER, allowNull: false },
        uploadDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        filePath: { type: DataTypes.STRING, allowNull: false },
    },
    {
        sequelize,
        tableName: "files",
        timestamps: false,
    }
);

export default File;
