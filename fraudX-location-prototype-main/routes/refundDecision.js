const express = require('express');
const router = express.Router();

// POST /api/refund-decision
// When admin approves/blocks a refund, broadcast to Catalyst site via Socket.IO
router.post('/refund-decision', async (req, res) => {
    const { deviceId, requestId, action } = req.body;

    if (!deviceId || !requestId || !action) {
        return res.status(400).json({
            ok: false,
            error: 'deviceId, requestId, and action are required'
        });
    }

    if (action !== 'approved' && action !== 'blocked') {
        return res.status(400).json({
            ok: false,
            error: 'action must be "approved" or "blocked"'
        });
    }

    const message = action === 'approved' ? 'Refund Approved' : 'Refund Rejected';

    // Fetch device data to get the amount
    let amount = 0;
    try {
        const StaleDevice = require('../models/staleDevice');
        const device = await StaleDevice.findOne({ deviceId });

        if (!device) {
            return res.status(404).json({
                ok: false,
                error: 'Device not found'
            });
        }

        amount = device.amount || 0;

        // Update database to persist the decision
        await StaleDevice.updateOne(
            { deviceId },
            { $set: { status: action } }
        );
        console.log(`💾 Database updated: ${deviceId} status set to ${action}, amount: ₹${amount}`);
    } catch (err) {
        console.error('Failed to update database:', err);
        return res.status(500).json({
            ok: false,
            error: 'Database error'
        });
    }

    // Emit Socket.IO event to all connected clients (including Catalyst site)
    const io = req.app.get('io');
    io.emit('refund_decision', {
        deviceId,
        requestId,
        action,
        message,
        amount,           // NOW INCLUDES AMOUNT!
        timestamp: Date.now()
    });

    console.log(`📢 Refund decision broadcasted: ${message} for ${deviceId} (₹${amount})`);

    res.json({
        ok: true,
        message: 'Decision broadcasted successfully',
        data: { deviceId, requestId, action, message, amount }
    });
});

module.exports = router;
