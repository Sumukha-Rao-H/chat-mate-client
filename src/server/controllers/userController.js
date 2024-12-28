const { sequelize, User} = require("../db");
const { Op } = require("sequelize");

const createOrUpdateUser = async (req, res) => {
    const { uid, email, name, picture } = req.user;

    try {
        const [user, created] = await User.findOrCreate({
            where: { uid },
            defaults: {
                email,
                displayName: name,
                photoUrl: picture,
            },
        });
        res.status(200).json({ user, created });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const searchUsers = async (req, res) => {
    const query = req.query.query; // Extract the search query from the request
    if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
    }

    try {
        // Search for users where displayName matches the query (case-insensitive)
        const users = await User.findAll({
            where: {
                displayName: {
                    [Op.iLike]: `%${query}%`, // Case-insensitive match
                },
            },
            attributes: ["uid","displayName","photoUrl"], // Only return displayName
        });

        res.status(200).json(users); // Send results back to the client
    } catch (error) {
        res.status(500).json({ message: "Error querying users", error: error.message });
    }
};

module.exports = { createOrUpdateUser, searchUsers };
