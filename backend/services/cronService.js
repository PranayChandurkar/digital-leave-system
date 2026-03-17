const cron = require('node-cron');
const Leave = require('../models/Leave');
const { sendEmail } = require('./emailService');

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily cron job for pending leaves auto-cancellation...');
    try {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const pendingLeaves = await Leave.find({
            status: 'Pending',
            createdAt: { $lte: twoDaysAgo }
        }).populate('studentId', 'email');

        for (let leave of pendingLeaves) {
            leave.status = 'Cancelled';
            leave.comments = 'Auto-cancelled due to no response within 2 days.';
            await leave.save();

            // Notify Student
            if (leave.studentId && leave.studentId.email) {
                await sendEmail(
                    leave.studentId.email,
                    'Leave Application Auto-Cancelled',
                    'Your leave application has been auto-cancelled because it received no response within 2 days of submission.'
                );
            }
        }

        if (pendingLeaves.length > 0) {
            console.log(`Auto-cancelled ${pendingLeaves.length} leaves.`);
        }
    } catch (error) {
        console.error('Error in cron job:', error);
    }
});
