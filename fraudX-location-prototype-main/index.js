
const cors = require('cors');
require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// I usually keep server/io setup close together so I don’t forget how they’re wired
const server = http.createServer(app);
const io = new socketIO.Server(server, {
    cors: {
        origin: '*', // wide open for now — revisit before prod
        methods: ['GET', 'POST']
    }
});

// ----- middleware stuff -----
app.use(cors()); // probably redundant with socket cors, but leaving it
app.use(express.json());

// serving static files (dashboard assets mostly)
app.use(express.static(path.join(__dirname, 'public')));

// view engine (EJS felt quick for this prototype)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// hacky but useful: make io accessible inside routes
app.set('io', io);

// ----- database connection -----
const mongoUri =
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/starksLocProto'; // local fallback

mongoose
    .connect(mongoUri)
    .then(() => {
        console.log('✅ MongoDB connected');
    })
    .catch((err) => {
        console.error('❌ MongoDB Error:', err);
    });

// ----- socket.io handlers -----
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // devices join their own rooms so we can target events later
    socket.on('join-device', (deviceId) => {
        if (!deviceId) return; // defensive, just in case
        socket.join(`device:${deviceId}`);
    });

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// ----- routes -----
app.use('/api/location', require('./routes/location'));

app.use('/', require('./routes/dashboard')); // default landing

// ----- error handler (last on purpose) -----
app.use((err, req, res, next) => {
    console.error(err.stack); // noisy, but helpful during dev

    res.status(500).json({
        ok: false,
        error:
            process.env.NODE_ENV === 'production'
                ? 'Internal Server Error'
                : err.message
    });
});

// ----- start server -----
const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
    console.log(`🚀 FraudX Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);

});

// ----- graceful shutdown -----
// copied + tweaked from another project, but it works
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');

    io.close(() => {
        console.log('🔌 Socket.IO closed');
    });

    try {
        await mongoose.connection.close();
        console.log('📦 MongoDB connection closed');
    } catch (e) {
        console.error('Mongo shutdown error:', e);
    }

    server.close(() => {
        console.log('🚀 Server closed');
        process.exit(0);
    });
});

// handle container / hosting providers
process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM received, shutting down...');
    process.emit('SIGINT'); // reuse logic instead of duplicating
});

// TODO: eventually split this file up — it’s getting chunky
