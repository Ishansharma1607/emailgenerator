const express = require('express');
const TempMailServer = require('./smtp-server');
const path = require('path');
const nodemailer = require('nodemailer');

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

// Add this new endpoint after your existing endpoints
app.post('/api/test-email', async (req, res) => {
    try {
        const email = req.query.email || 'test@tempmail.local';
        const result = await mailServer.sendTestEmail(email);
        res.json({ 
            success: true, 
            message: 'Test email sent',
            previewUrl: nodemailer.getTestMessageUrl(result)
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
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
