const express = require('express');
const router = express.Router();
const Property = require('../models/Property');


router.get('/', async (req, res) => {
    try {
        const listings = await Property.find();
        res.json(listings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


router.post('/', async (req, res) => {
    try {
        const data = req.body;

       
        if (Array.isArray(data)) {
            
            const newProperties = await Property.insertMany(data);
            res.status(201).json(newProperties); 
        
        } else {
            
            const newProperty = new Property(data);
            await newProperty.save();
            res.status(201).json(newProperty); 
        }
        

    } catch (err) {
        
        console.error(err.message);
        res.status(400).json({ message: 'Error creating property/properties.', error: err.message });
    }
});

module.exports = router;

