// load things needed
var mongoose = require("mongoose");

// define the schema for our booking model
var bookingSchema = new mongoose.Schema(
    {
        fromDate: String,
        toDate: String,
        days: String,
        approved: Boolean,
        requestedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]
    }
);

module.exports = mongoose.model("Booking", bookingSchema);