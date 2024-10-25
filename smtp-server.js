const SMTPServer = require('smtp-server').SMTPServer;
const simpleParser = require('mailparser').simpleParser;
const crypto = require('crypto');

class TempMailServer {
    constructor(port = 2525) {
        this.port = port;
        this.emails = new Map();
        this.domains = ['tempmail.local']; // You can add more domains
        this.server = new SMTPServer({
            authOptional: true,
            onData: (stream, session, callback) => this.handleEmail(stream, session, callback)
        });
    }

    generateTempEmail() {
        const randomString = crypto.randomBytes(8).toString('hex');
        return `${randomString}@${this.domains[0]}`;
    }

    async handleEmail(stream, session, callback) {
        const parsed = await simpleParser(stream);
        const to = parsed.to.text;
        
        if (this.emails.has(to)) {
            const handler = this.emails.get(to);
            handler({
                from: parsed.from.text,
                subject: parsed.subject,
                body: parsed.text
            });
        }
        
        callback();
    }

    registerEmailHandler(email, handler) {
        this.emails.set(email, handler);
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`SMTP Server running on port ${this.port}`);
        });
    }
}

module.exports = TempMailServer;
