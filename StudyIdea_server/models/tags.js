const mongoose = require("mongoose");
const { type } = require("os");

const tagsSchema  =  new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },

    descption:{
        type:String,
    },

    course:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course",
    },


});

module.exports = mongoose.model("Tag",tagsSchema);