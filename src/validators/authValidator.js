const { z } = require('zod');

const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

exports.validateRegister = (req, res, next) => {
    try {
        registerSchema.parse(req.body);
        next();
    } catch (error) {
        return res.status(400).json({
            errors: error.errors.map(err => ({
                field: err.path[0],
                message: err.message
            }))
        });
    }
};