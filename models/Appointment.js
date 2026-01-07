const mongoose = require('mongoose');


const AppointmentSchema = new mongoose.Schema({
    
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: [true, 'User is required for an appointment.'],
    },
    // The property being viewed
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property', 
        required: [true, 'Property is required for an appointment.'],
    },
    
    date: {
        type: Date,
        default: Date.now,
    },
   
    fee: {
        type: Number,
        required: [true, 'Fee is required.'],
    },
    
    paymentMethod: {
        type: String,
        required: [true, 'Payment method is required.'],
    },
    
    paymentStatus: {
        type: String,
        required: true,
        enum: ['Pending', 'Completed', 'Failed'], 
        default: 'Pending', 
    },
}, {
    timestamps: true, 
});

module.exports = mongoose.model('Appointment', AppointmentSchema);

