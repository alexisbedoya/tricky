const mongoose = require('mongoose');

const Room_Schema = new mongoose.Schema({
    uID:{
        type:String,
        required:true,
        unique:[true,'la id de la sala debe ser unica']
    },
    noOfUser:{
        type:Number,
        required:true
    }
});

const Room = mongoose.model('Room' , Room_Schema);
module.exports = Room;