const TempMailServer = require('./smtp-server');

async function main() {
    // Create and start the temp mail server
    const mailServer = new TempMailServer();
    mailServer.start();

    // Generate a temporary email
    const tempEmail = mailServer.generateTempEmail();
    console.log('Your temporary email:', tempEmail);

    // Register handler for incoming emails
    mailServer.registerEmailHandler(tempEmail, (email) => {
        console.log('New email received:');
        console.log('From:', email.from);
        console.log('Subject:', email.subject);
        console.log('Body:', email.body);
    });
}

main().catch(console.error);
