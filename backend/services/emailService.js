const { Resend } = require('resend');

let resend = null;

const getResendClient = () => {
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
};

const sendEmail = async (to, subject, text) => {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
        console.log('Email credentials not set. Simulated email:', { to, subject });
        return;
    }

    try {
        const { data, error } = await getResendClient().emails.send({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            text,
        });

        if (error) {
            console.error('Resend API error:', error.message || error);
            return;
        }

        console.log('Email sent: %s', data?.id);
    } catch (error) {
        console.error('Error sending email:', error.message || error);
    }
};

module.exports = { sendEmail };
