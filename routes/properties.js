const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Import Models
const Property = require('../models/Property');
const Appointment = require('../models/Appointment'); 


router.get('/', async (req, res) => {
    try {
        const properties = await Property.find();
        res.status(200).json({
            success: true,
            count: properties.length,
            data: properties
        });
    } catch (err) {
        console.error('GET PROPERTIES ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ success: false, message: 'Property not found' });
        }
        res.status(200).json({
            success: true,
            data: property
        });
    } catch (err) {
        console.error('GET PROPERTY ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const property = await Property.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Property created successfully',
            data: property
        });
    } catch (err) {
        console.error('CREATE PROPERTY ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        let property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(4404).json({ success: false, message: 'Property not found' });
        }
        
        property = await Property.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            message: 'Property updated successfully',
            data: property
        });
    } catch (err) {
        console.error('UPDATE PROPERTY ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});



router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ success: false, message: 'Property not found' });
        }

        // Cascade delete: Remove all appointments for this property
        await Appointment.deleteMany({ property: req.params.id });
        
        // Delete the property itself
        await Property.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: 'Property and associated appointments deleted successfully' });
    } catch (err) {
        console.error('DELETE PROPERTY ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


router.delete('/', protect, authorize('admin'), async (req, res) => {
    try {
        // This is a highly destructive operation
        
        // Cascade delete: Remove ALL appointments first
        const apptDeleteResult = await Appointment.deleteMany({});
        
        // Then delete ALL properties
        const propDeleteResult = await Property.deleteMany({});

        res.status(200).json({ 
            success: true, 
            message: `Successfully deleted ${propDeleteResult.deletedCount} properties and ${apptDeleteResult.deletedCount} appointments.`
        });
    } catch (err) {
        console.error('DELETE ALL PROPERTIES ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;

