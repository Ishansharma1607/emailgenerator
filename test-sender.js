const nodemailer = require('nodemailer');

async function sendTestEmail() {
    // Create a test SMTP transport
    const transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 2525,
        secure: false,
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        // Replace with the temporary email that your server generated
        const tempEmail = '50550d6ec1dcb63d@tempmail.local'; // You'll get this from the server output

        // Send test email
        const info = await transporter.sendMail({
            from: 'test@example.com',
            to: tempEmail,
            subject: 'Test Email',
            text: 'This is a test email from your local SMTP server!'
        });

        console.log('Test email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

sendTestEmail();
