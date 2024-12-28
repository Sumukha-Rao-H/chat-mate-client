const { DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const Friendship = sequelize.define("Friendship", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user1Uid: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: "Users", // Assuming the table name is Users
                key: "uid",
            },
        },
        user2Uid: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: "Users", // Assuming the table name is Users
                key: "uid",
            },
        },
    }, {
        timestamps: true,
    });

    return Friendship;
};

