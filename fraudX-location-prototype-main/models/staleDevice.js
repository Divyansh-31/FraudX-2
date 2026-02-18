const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    deviceId: { type: String, required: true, index: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    riskScore: { type: Number, default: 0 },
    fraudTypes: [String],
    speed: Number,
    lastSeen: { type: Number, required: true },
    detectedAt: { type: Number, required: true },
    status: { type: String, default: "Pending" }, // "Pending", "approved", "blocked"
    amount: { type: Number, default: 0 }, // Refund amount in ₹
    orderId: { type: String, default: "" }, // Order ID from Catalyst
}, {
    timestamps: true
});

module.exports = mongoose.model("StaleDevice", schema);
