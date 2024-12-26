const User = require("../models/userModel");

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

module.exports = { createOrUpdateUser };
