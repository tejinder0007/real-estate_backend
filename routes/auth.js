const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../middleware/auth');


const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};


router.post('/register', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        user = new User({ email, password, role });
        await user.save();
        const token = signToken(user._id);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: { id: user._id, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('REGISTER ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
});


router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        const token = signToken(user._id);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: { id: user._id, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('LOGIN ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
});


router.get('/users', protect, authorize('admin'), async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (err) {
        console.error('GET USERS ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Safety checks:
        if (user.id === req.user.id) {
             return res.status(400).json({ success: false, message: 'Admin cannot delete themselves' });
        }
        if (user.role === 'admin') {
             return res.status(403).json({ success: false, message: 'Cannot delete another admin account' });
        }
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        console.error('DELETE USER ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


router.delete('/users', protect, authorize('admin'), async (req, res) => {
    try {
        // Safe delete: only deletes users with the role 'user'
        const deleteResult = await User.deleteMany({ role: 'user' });
        res.status(200).json({ 
            success: true, 
            message: `Successfully deleted ${deleteResult.deletedCount} users.` 
        });
    } catch (err) {
        console.error('DELETE ALL USERS ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;

