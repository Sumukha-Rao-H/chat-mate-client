module.exports = (sequelize, DataTypes) => {
    const Friendship = sequelize.define("Friendship", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user1Uid: {
            type: DataTypes.STRING,  // Make sure it's referencing the 'uid' field in the 'User' model
            allowNull: false,
            references: {
                model: "Users", // Reference to the 'Users' table
                key: "uid", // Referencing the 'uid' field of the Users table
            },
        },
        user2Uid: {
            type: DataTypes.STRING,  // Again, referencing the 'uid' field in the 'User' model
            allowNull: false,
            references: {
                model: "Users", // Reference to the 'Users' table
                key: "uid", // Referencing the 'uid' field of the Users table
            },
        },
    }, {
        timestamps: true,
    });

    return Friendship;
};
