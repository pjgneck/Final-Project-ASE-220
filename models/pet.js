const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const petSchema = new Schema({
    name: {
        type: String,
        requied: true
    },
    imageLink: {
        type: String
    },
    type: {
        type: String,
        requied: true
    },
    gender: {
        type: String,
        requied: true
    },
    age: {
        type: String,
        requied: true
    },
    description: {
        type: String,
        requied: true
    },
    createdById: {
        type: String,
        requied: true
    },
    createdByUsername: {
        type: String,
        requied: true
    },
    comments:  {
        type: Array,
    },
}, { timestamps: true });

const pet = mongoose.model('Pet', petSchema);
module.exports = pet;