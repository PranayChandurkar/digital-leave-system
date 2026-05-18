const Leave = require('../models/Leave');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { GoogleGenAI } = require('@google/genai');

// @desc    Submit a new leave application
// @route   POST /api/leaves
// @access  Private (Student)
const submitLeave = async (req, res) => {
    try {
        const { type, content, attachmentUrl } = req.body;

        const student = await User.findById(req.user._id);
        const coordinator = await User.findById(student.createdBy);

        if (coordinator && coordinator.leavePolicy && coordinator.leavePolicy.durationFrom) {
            const policy = coordinator.leavePolicy;
            const now = new Date();
            // Check if current date is within policy duration
            if (now >= new Date(policy.durationFrom) && now <= new Date(policy.durationTo)) {
                // Count leaves
                const usedLeaves = await Leave.countDocuments({
                    studentId: req.user._id,
                    createdAt: { $gte: policy.durationFrom, $lte: policy.durationTo },
                    status: { $nin: ['Cancelled', 'Rejected'] }
                });

                if (usedLeaves >= policy.maxLeaves) {
                    return res.status(400).json({ message: `Leave limit reached. You have already used ${usedLeaves} out of ${policy.maxLeaves} leaves for the current term.` });
                }
            }
        }

        const newLeave = await Leave.create({
            studentId: req.user._id,
            type,
            content,
            attachmentUrl,
        });

        // Notify Student and Coordinator
        if (coordinator) {
            await sendEmail(coordinator.email, 'New Leave Application', `Student ${student.name} has submitted a new leave application.`);
        }
        await sendEmail(student.email, 'Leave Application Submitted', 'Your leave application has been submitted successfully.');

        res.status(201).json(newLeave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Edit a pending leave
// @route   PUT /api/leaves/:id
// @access  Private (Student)
const editLeave = async (req, res) => {
    try {
        const { type, content, attachmentUrl } = req.body;
        const leave = await Leave.findById(req.params.id);

        if (!leave) return res.status(404).json({ message: 'Leave not found' });
        if (leave.studentId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
        if (leave.status !== 'Pending') return res.status(400).json({ message: 'Can only edit pending leaves' });

        leave.type = type || leave.type;
        leave.content = content || leave.content;
        leave.attachmentUrl = attachmentUrl !== undefined ? attachmentUrl : leave.attachmentUrl;

        await leave.save();
        res.json(leave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel a pending leave
// @route   DELETE /api/leaves/:id
// @access  Private (Student)
const cancelLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);

        if (!leave) return res.status(404).json({ message: 'Leave not found' });
        if (leave.studentId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
        if (leave.status !== 'Pending') return res.status(400).json({ message: 'Can only cancel pending leaves' });

        leave.status = 'Cancelled';
        await leave.save();

        await sendEmail(req.user.email, 'Leave Cancelled', 'You have successfully cancelled your leave application.');

        res.json({ message: 'Leave cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in student's leaves
// @route   GET /api/leaves/my-leaves
// @access  Private (Student)
const getMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ studentId: req.user._id }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get coordinator's queue
// @route   GET /api/leaves/queue
// @access  Private (Coordinator, HOD)
const getQueue = async (req, res) => {
    try {
        if (req.user.role === 'Coordinator') {
            // Find students created by this coordinator
            const students = await User.find({ createdBy: req.user._id }).select('_id');
            const studentIds = students.map(s => s._id);

            const leaves = await Leave.find({ studentId: { $in: studentIds } })
                .populate('studentId', 'name email')
                .sort({ createdAt: -1 });
            return res.json(leaves);
        } else if (req.user.role === 'HOD') {
            const leaves = await Leave.find({ status: 'Forwarded' })
                .populate('studentId', 'name email')
                .sort({ createdAt: -1 });
            return res.json(leaves);
        }
        res.status(403).json({ message: 'Not authorized' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Process a leave application (Approve, Reject, Forward)
// @route   PUT /api/leaves/:id/process
// @access  Private (Coordinator, HOD)
const processLeave = async (req, res) => {
    try {
        const { action, comments } = req.body;
        const leave = await Leave.findById(req.params.id).populate('studentId', 'name email createdBy');

        if (!leave) return res.status(404).json({ message: 'Leave not found' });

        // Authorization checks
        if (req.user.role === 'Coordinator') {
            // Must belong to this coordinator's student
            if (leave.studentId.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized for this student' });
            }
            if (!['Pending'].includes(leave.status)) {
                return res.status(400).json({ message: 'Cannot process this leave at current status' });
            }
            if (!['Approve', 'Reject', 'Forward'].includes(action)) {
                return res.status(400).json({ message: 'Invalid action for Coordinator' });
            }
        } else if (req.user.role === 'HOD') {
            if (!['Forwarded'].includes(leave.status)) {
                return res.status(400).json({ message: 'HOD can only process Forwarded leaves' });
            }
            if (!['Approve', 'Reject'].includes(action)) {
                return res.status(400).json({ message: 'Invalid action for HOD' });
            }
        }

        // Apply Action
        if (action === 'Approve') leave.status = 'Approved';
        if (action === 'Reject') leave.status = 'Rejected';
        if (action === 'Forward') leave.status = 'Forwarded';

        leave.comments = comments || leave.comments;
        leave.processedBy = `${req.user.name} (${req.user.role})`;
        leave.processedAt = new Date();
        await leave.save();

        // Send Email Notifications
        let subject = `Leave Application ${leave.status}`;
        let text = `Your leave application has been ${leave.status}.\nComments: ${leave.comments}`;
        await sendEmail(leave.studentId.email, subject, text);

        if (action === 'Forward') {
            const hod = await User.findOne({ role: 'HOD' });
            if (hod) {
                await sendEmail(hod.email, 'Leave Application Forwarded', `A new leave application has been forwarded to you.`);
            }
        }

        res.json(leave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate formal leave letter using AI
// @route   POST /api/leaves/generate
// @access  Private (Student)
const generateLeaveText = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server. Please add it to .env files.' });

        const ai = new GoogleGenAI({ apiKey });
        
        const systemInstruction = `You are an expert at writing formal, polite, and detailed student leave application letters.
The user will provide a short reason.
Your response MUST be a fully fleshed-out formal application letter of at least two paragraphs.
Start with "Respected Sir/Madam,".
Elaborate appropriately on the provided reason in a professional tone, explaining how you will catch up on missed work or ensure minimum disruption to your studies.
Conclude with a proper closing like "Thanking you in advance for your understanding," and "Yours obediently,".
CRITICAL: NEVER use placeholder brackets like [Start Date], [End Date], [Name], or [Reason]. Instead, write naturally (e.g., "for the required duration", "during my absence"). Do not leave any fill-in-the-blanks. Provide ONLY the letter content.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Reason for leave: ${prompt}. Please generate the formal letter.`,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        res.json({ content: response.text });
    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ message: 'Failed to generate content with AI' });
    }
};

// @desc    Get student's leave history
// @route   GET /api/leaves/student/:id
// @access  Private (Coordinator, HOD)
const getStudentHistory = async (req, res) => {
    try {
        const studentId = req.params.id;
        
        // Authorization check
        if (req.user.role === 'Coordinator') {
            const student = await User.findById(studentId);
            if (!student || student.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to view this student\'s history' });
            }
        }

        const leaves = await Leave.find({ studentId }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { submitLeave, editLeave, cancelLeave, getMyLeaves, getQueue, processLeave, generateLeaveText, getStudentHistory };
