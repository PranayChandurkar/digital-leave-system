const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }
    return transporter;
};

const sendEmail = async (to, subject, text) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('Email credentials not set. Simulated email:', { to, subject });
        return;
    }

    try {
        const info = await getTransporter().sendMail({
            from: `"Leave Management System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
        });
        console.log('Email sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = { sendEmail };
