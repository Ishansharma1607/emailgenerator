const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Imap = require('imap');
const {simpleParser} = require('mailparser');

class TempMailServer {
    constructor() {
        this.emails = new Map();
        this.setupGmail();
    }

    setupGmail() {
        // Gmail SMTP setup
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD
            }
        });

        // Setup IMAP
        this.imap = new Imap({
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_APP_PASSWORD,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        });

        // Handle IMAP connection
        this.imap.once('ready', () => {
            this.imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    console.error('Error opening mailbox:', err);
                    return;
                }
                console.log('Connected to INBOX');
                this.listenForEmails();
            });
        });

        this.imap.on('error', (err) => {
            console.error('IMAP error:', err);
        });

        this.imap.on('end', () => {
            console.log('IMAP connection ended');
            setTimeout(() => {
                this.imap.connect();
            }, 5000);
        });
    }

    listenForEmails() {
        this.imap.on('mail', () => {
            this.imap.search(['UNSEEN'], (err, results) => {
                if (err || !results.length) return;

                const fetch = this.imap.fetch(results, {
                    bodies: '',
                    markSeen: true
                });

                fetch.on('message', (msg) => {
                    msg.on('body', (stream) => {
                        simpleParser(stream, (err, parsed) => {
                            if (err) return;
                            
                            const to = parsed.to.text;
                            const plusPart = to.match(/\+([^@]+)@/);
                            
                            if (plusPart && this.emails.has(plusPart[1])) {
                                const handler = this.emails.get(plusPart[1]);
                                handler({
                                    from: parsed.from.text,
                                    subject: parsed.subject,
                                    body: parsed.text
                                });
                            }
                        });
                    });
                });
            });
        });
    }

    generateTempEmail() {
        const randomString = crypto.randomBytes(8).toString('hex');
        const baseEmail = process.env.EMAIL_USER.split('@')[0];
        const domain = process.env.EMAIL_USER.split('@')[1];
        return `${baseEmail}+${randomString}@${domain}`;
    }

    registerEmailHandler(email, handler) {
        const plusPart = email.match(/\+([^@]+)@/);
        if (plusPart) {
            this.emails.set(plusPart[1], handler);
        }
    }

    async sendTestEmail(to) {
        try {
            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: to,
                subject: 'Test Email',
                text: 'This is a test email from your temporary email service!'
            });
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    start() {
        console.log('Gmail service initializing...');
        this.imap.connect();
    }
}

module.exports = TempMailServer;
