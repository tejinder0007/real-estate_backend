const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const shortid = require('shortid');

// Import Middleware
const { protect, authorize } = require('../middleware/auth');

// Import Models
const Appointment = require('../models/Appointment');
const Property = require('../models/Property');
const User = require('../models/User');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @route   GET /api/appointments
 * @desc    Get all appointments (Admin only)
 */
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate('user', 'email') // Populate user's email
            .populate('property', 'location'); // Populate property's location

        res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });
    } catch (err) {
        console.error('GET APPOINTMENTS ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   POST /api/appointments/book
 * @desc    Create a new appointment booking
 */
router.post('/book', protect, async (req, res) => {
    const { propertyId, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!propertyId || !paymentMethod) {
        return res.status(400).json({ success: false, message: 'Property ID and Payment Method are required.' });
    }
    
    try {
        // 1. Get Property and User details
        const property = await Property.findById(propertyId);
        const user = await User.findById(userId);

        if (!property) {
            return res.status(404).json({ success: false, message: 'Property not found' });
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const amountInPaise = 1000 * 100; // Assuming ₹1000 fee

        // --- Handle "Pay on Visit" ---
        if (paymentMethod === 'Pay on Visit') {
            const appointment = await Appointment.create({
                user: userId,
                property: propertyId,
                fee: 1000,
                paymentMethod: 'Pay on Visit',
                paymentStatus: 'Pending', // Will be confirmed on visit
                date: new Date(),
                razorpayOrderId: `pov_${shortid.generate()}` // Create a unique ID
            });

            return res.status(201).json({
                success: true,
                message: 'Appointment booked successfully for "Pay on Visit".',
                isPayOnVisit: true, // <-- ***** THE FIX IS HERE *****
                data: {
                    appointmentId: appointment._id,
                    paymentMethod: 'Pay on Visit'
                }
            });
        }

        // --- Handle "Pay with Razorpay" ---
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: shortid.generate(),
            payment_capture: 1, // Auto-capture payment
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // 3. Create our Appointment in DB with PENDING status
        const appointment = await Appointment.create({
            user: userId,
            property: propertyId,
            fee: 1000,
            paymentMethod: 'Pay with Razorpay',
            paymentStatus: 'Pending',
            date: new Date(),
            razorpayOrderId: razorpayOrder.id,
        });

        // 4. Send Order details to frontend
        res.status(201).json({
            success: true,
            message: 'Razorpay order created successfully.',
            data: {
                appointmentId: appointment._id,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                userName: user.name || user.email.split('@')[0],
                userEmail: user.email,
            }
        });

    } catch (err) {
        console.error('BOOKING ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error during booking initiation.' });
    }
});


/**
 * @route   POST /api/appointments/payment-verification
 * @desc    Webhook for Razorpay to verify payment
 */
router.post('/payment-verification', async (req, res) => {
    // IMPORTANT: Set this webhook secret in your Razorpay dashboard
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    try {
        const shasum = crypto.createHmac('sha256', secret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');

        if (digest === req.headers['x-razorpay-signature']) {
            // Signature is valid
            const { order_id, payment_id } = req.body.payload.payment.entity;

            // Find the appointment and update its status
            const appointment = await Appointment.findOneAndUpdate(
                { razorpayOrderId: order_id },
                { 
                    paymentStatus: 'Completed',
                    razorpayPaymentId: payment_id,
                },
                { new: true } // Return the updated document
            );

            if (appointment) {
                console.log(`Payment confirmed for Appointment ${appointment._id}`);
            } else {
                console.warn(`Payment received for unknown Order ID: ${order_id}`);
            }
            
            // Respond to Razorpay
            res.json({ status: 'ok' });

        } else {
            // Signature is invalid
            console.warn('Invalid Razorpay webhook signature received.');
            res.status(403).json({ status: 'invalid_signature' });
        }
    } catch (err) {
        console.error('RAZORPAY WEBHOOK ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error during payment verification' });
    }
});


// --- NEW DELETE ROUTES ---

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Delete a single appointment by ID (Admin only)
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        await Appointment.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: 'Appointment deleted successfully' });

    } catch (err) {
        console.error('DELETE APPOINTMENT ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   DELETE /api/appointments
 * @desc    Delete all appointments (Admin only)
 */
router.delete('/', protect, authorize('admin'), async (req, res) => {
    try {
        // This is a destructive operation: it deletes ALL appointments.
        const deleteResult = await Appointment.deleteMany({});

        res.status(200).json({ 
            success: true, 
            message: `Successfully deleted ${deleteResult.deletedCount} appointments.` 
        });

    } catch (err) {
        console.error('DELETE ALL APPOINTMENTS ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;