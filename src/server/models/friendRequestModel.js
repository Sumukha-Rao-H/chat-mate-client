module.exports = (sequelize, DataTypes) => {
    const FriendRequest = sequelize.define("FriendRequest", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        senderUid: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: "Users", // Matches the table name for your `User` model
                key: "uid",
            },
        },
        receiverUid: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: "Users", // Matches the table name for your `User` model
                key: "uid",
            },
        },
        status: {
            type: DataTypes.ENUM("pending", "accepted", "rejected"),
            defaultValue: "pending",
        },
    }, {
        tableName: "friendRequests", // Explicitly set the table name here
        timestamps: true,
    });

    return FriendRequest;
};
