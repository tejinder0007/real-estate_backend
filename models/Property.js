const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    location: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    type: {
        type: String,
        required: true,
        enum: ['House', 'Apartment', 'Kothi', 'Plot']
    },
    imageUrl: { type: String, required: true }, 

    
    area: { // Area in square feet
        type: Number,
        default: 1200 
    },
    status: { // Property status
        type: String,
        enum: ['Ready to Move', 'Under Construction'],
        default: 'Ready to Move'
    },
    facing: { // Direction property faces
        type: String,
        enum: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'],
        default: 'East'
    },
    amenities: { // List of available amenities
        type: [String],
        default: ['Parking', 'Power Backup', 'Security']
    },
    galleryImages: { // Array of URLs for the image gallery
        type: [String],
        default: []
    }
});

module.exports = mongoose.model('Property', propertySchema);

