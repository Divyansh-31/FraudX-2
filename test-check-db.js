// Simple script to check database content
const mongoose = require('mongoose');
const StaleDevice = require('./fraudX-location-prototype-main/models/staleDevice');

mongoose.connect('mongodb://localhost:27017/fraudX', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function checkDB() {
    try {
        const devices = await StaleDevice.find().sort({ detectedAt: -1 }).limit(5);
        console.log('\n📊 Latest 5 Stale Devices:\n');
        devices.forEach((d, i) => {
            console.log(`\n${i + 1}. Device: ${d.deviceId}`);
            console.log(`   Status: ${d.status}`);
            console.log(`   Amount: ₹${d.amount || 0}`);
            console.log(`   OrderID: ${d.orderId || 'N/A'}`);
            console.log(`   Risk Score: ${d.riskScore}`);
            console.log(`   Detected: ${new Date(d.detectedAt).toLocaleString()}`);
        });

        // Check blocked ones specifically
        const blocked = await StaleDevice.find({ status: 'blocked' });
        console.log(`\n\n🚫 Total Blocked: ${blocked.length}`);
        const totalBlocked = blocked.reduce((sum, d) => sum + (d.amount || 0), 0);
        console.log(`💰 Total Blocked Amount: ₹${totalBlocked}`);

        if (totalBlocked === 0) {
            console.log('\n⚠️  WARNING: All amounts are 0! Pings are not including amount field.');
        }

        mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
        mongoose.connection.close();
    }
}

checkDB();
