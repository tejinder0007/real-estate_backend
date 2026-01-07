const jwt = require('jsonwebtoken');
const User = require('../models/User'); 


exports.protect = async (req, res, next) => {
    let token;

    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        
        token = req.headers.authorization.split(' ')[1];
    } 
   
    // 2. Check if token exists
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized to access this route. Token missing.' 
        });
    }

    try {
       
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach the user object to the request (excluding password)
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User belonging to this token no longer exists.' 
            });
        }

        next(); 
    } catch (err) {
        console.error("JWT Verification Error:", err.message);
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized to access this route. Invalid token.' 
        });
    }
};

/**
 * Middleware to restrict access to specific roles (e.g., 'admin')
 * @param {...string} roles - Array of allowed roles, e.g., ['admin', 'manager']
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // Check if the user's role is included in the allowed roles list
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `User role (${req.user ? req.user.role : 'unauthenticated'}) is not authorized to access this route.` 
            });
        }
        next();
    };
};
