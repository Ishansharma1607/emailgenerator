const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const { ImapFlow } = require('imapflow');
const crypto = require('crypto');

class TempMailGenerator {
    constructor(gmailUser, gmailAppPassword) {
        this.gmailUser = gmailUser;
        this.gmailAppPassword = gmailAppPassword;
        this.domain = gmailUser.split('@')[1];
    }

    generateTempEmail() {
        // Generate a random string for the email prefix
        const randomString = crypto.randomBytes(8).toString('hex');
        return `${randomString}@${this.domain}`;
    }

    async setupEmailListener(onNewEmail) {
        const client = new ImapFlow({
            host: 'imap.gmail.com',
            port: 993,
            secure: true,
            auth: {
                user: this.gmailUser,
                pass: this.gmailAppPassword
            }
        });

        await client.connect();

        // Listen for new emails
        let lock = await client.getMailboxLock('INBOX');
        try {
            client.on('exists', async (data) => {
                const message = await client.fetchOne(data.uid, { source: true });
                if (onNewEmail) {
                    onNewEmail({
                        from: message.from,
                        subject: message.subject,
                        body: message.text
                    });
                }
            });
        } finally {
            lock.release();
        }
    }
}

module.exports = TempMailGenerator;
