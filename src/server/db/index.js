const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

// Create a connection to the database
const sequelize = new Sequelize(process.env.DATABASE_NAME, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
    host: process.env.DATABASE_HOST,
    dialect: "postgres",
});

// Dynamically load models
const User = require("../models/userModel")(sequelize, DataTypes);
const FriendRequest = require("../models/friendRequestModel")(sequelize, DataTypes);
const Friendship = require("../models/friendshipModel")(sequelize, DataTypes);

// Define associations
User.hasMany(FriendRequest, { foreignKey: "senderUid", as: "sentRequests" });
User.hasMany(FriendRequest, { foreignKey: "receiverUid", as: "receivedRequests" });
User.belongsToMany(User, {
    through: Friendship,
    foreignKey: "user1Uid",
    otherKey: "user2Uid",
    as: "friends",
});

module.exports = { sequelize, User, FriendRequest, Friendship };
