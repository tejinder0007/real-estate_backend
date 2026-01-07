const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Property = require('../models/Property');

/**
 * @route   GET /api/admin/stats
 * @desc    Get aggregated stats for the admin dashboard
 * @access  Private (Admin)
 */
router.get('/stats', protect, authorize('admin'), async (req, res) => {
    try {
        // 1. Get Property Appointment Counts
        const apptStats = await Appointment.aggregate([
            { $match: { paymentStatus: 'Completed' } }, // Only count successful appointments
            { $group: { _id: '$property', count: { $sum: 1 } } }
        ]);

        // Convert array [{_id: 'propId1', count: 5}, ...] to object { 'propId1': 5, ... }
        const propertyStats = apptStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});

        // 2. Get Main Dashboard Stats
        const totalUsers = await User.countDocuments({ role: 'user' });
        const allAppointments = await Appointment.find();
        
        const totalAppointments = allAppointments.length;
        const successfulAppointments = allAppointments.filter(a => a.paymentStatus === 'Completed').length;
        const totalRevenue = allAppointments.reduce((acc, appt) => {
            return appt.paymentStatus === 'Completed' ? acc + appt.fee : acc;
        }, 0);

        res.json({
            success: true,
            data: {
                propertyStats, // For the HomePage cards
                dashboardStats: { // For the AdminDashboard KPIs
                    totalUsers,
                    totalAppointments,
                    successfulAppointments,
                    totalRevenue
                }
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;