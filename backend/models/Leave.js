const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['Medical', 'Important', 'Less Important'],
    required: true,
  },
  content: {
    type: String, // The letter payload
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Forwarded', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending',
  },
  attachmentUrl: {
    type: String, // Path or URL to the uploaded PDF
    default: null,
  },
  comments: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
