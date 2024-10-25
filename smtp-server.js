const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Imap = require('imap');
const {simpleParser} = require('mailparser');

class TempMailServer {
    constructor() {
        this.emails = new Map();
        this.setupGmail();
        this.setupImapListener();
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
    }

    setupImapListener() {
        this.imap = new Imap({
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_APP_PASSWORD,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        });

        this.imap.on('ready', () => {
            this.listenForEmails();
        });

        this.imap.on('error', (err) => {
            console.error('IMAP error:', err);
            // Try to reconnect after error
            setTimeout(() => {
                this.imap.connect();
            }, 10000);
        });

        this.imap.connect();
    }

    async listenForEmails() {
        try {
            await this.imap.openBox('INBOX', false);
            console.log('Watching for new emails...');

            this.imap.on('mail', () => {
                this.fetchNewEmails();
            });
        } catch (err) {
            console.error('Error opening mailbox:', err);
        }
    }

    async fetchNewEmails() {
        try {
            const messages = await new Promise((resolve, reject) => {
                this.imap.search(['UNSEEN'], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });

            if (!messages.length) return;

            const fetch = this.imap.fetch(messages, {
                bodies: '',
                markSeen: true
            });

            fetch.on('message', (msg) => {
                msg.on('body', async (stream) => {
                    try {
                        const parsed = await simpleParser(stream);
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
                    } catch (err) {
                        console.error('Error processing message:', err);
                    }
                });
            });
        } catch (err) {
            console.error('Error fetching emails:', err);
        }
    }

    generateTempEmail() {
        const randomString = crypto.randomBytes(8).toString('hex');
        const baseEmail = process.env.EMAIL_USER.split('@')[0];
        const domain = process.env.EMAIL_USER.split('@')[1];
        return `${baseEmail}+${randomString}@${domain}`;
    }

    registerEmailHandler(email, handler) {
        const plusPart = email.match(/\+([^@]+)@/)[1];
        this.emails.set(plusPart, handler);
    }

    async sendTestEmail(to) {
        const info = await this.transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: to,
            subject: 'Test Email',
            text: 'This is a test email from your temporary email service!'
        });
        return info;
    }

    start() {
        console.log('Gmail service initialized');
    }
}

module.exports = TempMailServer;
