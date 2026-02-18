const express = require('express');
const router = express.Router();

// POST /api/refund-decision
// When admin approves/blocks a refund, broadcast to Catalyst site via Socket.IO
router.post('/refund-decision', async (req, res) => {
    const { deviceId, requestId, mongoId, action } = req.body;

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

    let amount = 0;
    try {
        const StaleDevice = require('../models/staleDevice');

        // Use mongoId for precise single-record update if available
        if (mongoId) {
            const device = await StaleDevice.findById(mongoId);
            if (!device) {
                console.log(`❌ No device found with _id: ${mongoId}`);
                return res.status(404).json({ ok: false, error: 'Device not found' });
            }
            amount = device.amount || 0;
            device.status = action;
            await device.save();
            console.log(`💾 Updated single record: _id=${mongoId} → ${action} (₹${amount})`);
        } else {
            // Fallback: update by deviceId (for backwards compatibility)
            const device = await StaleDevice.findOne({ deviceId });
            if (!device) {
                return res.status(404).json({ ok: false, error: 'Device not found' });
            }
            amount = device.amount || 0;
            await StaleDevice.updateOne({ _id: device._id }, { $set: { status: action } });
            console.log(`💾 Updated by deviceId fallback: ${deviceId} → ${action} (₹${amount})`);
        }
    } catch (err) {
        console.error('Failed to update database:', err);
        return res.status(500).json({ ok: false, error: 'Database error' });
    }

    // Emit Socket.IO event to all connected clients
    const io = req.app.get('io');
    io.emit('refund_decision', {
        deviceId,
        requestId,
        mongoId,
        action,
        message,
        amount,
        timestamp: Date.now()
    });

    console.log(`📢 Refund decision: ${message} for ${deviceId} (₹${amount})`);

    res.json({
        ok: true,
        message: 'Decision broadcasted successfully',
        data: { deviceId, requestId, mongoId, action, message, amount }
    });
});

module.exports = router;
