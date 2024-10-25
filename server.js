const express = require('express');
const TempMailServer = require('./smtp-server');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Create mail server instance
const mailServer = new TempMailServer();

// Serve static files
app.use(express.static('public'));

// API endpoints
app.get('/api/generate-email', (req, res) => {
    const tempEmail = mailServer.generateTempEmail();
    res.json({ email: tempEmail });
});

// WebSocket setup for real-time email notifications
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', (socket) => {
    socket.on('register-email', (email) => {
        mailServer.registerEmailHandler(email, (emailData) => {
            socket.emit('new-email', emailData);
        });
    });
});

// Start both express and SMTP server
server.listen(port, () => {
    console.log(`Web server running on port ${port}`);
    mailServer.start();
});
