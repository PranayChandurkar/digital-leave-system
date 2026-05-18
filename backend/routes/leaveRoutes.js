const express = require('express');
const router = express.Router();
const { submitLeave, editLeave, cancelLeave, getMyLeaves, getQueue, processLeave, generateLeaveText, getStudentHistory } = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('Student'), submitLeave);
router.post('/generate', protect, authorize('Student'), generateLeaveText);
router.get('/my-leaves', protect, authorize('Student'), getMyLeaves);
router.put('/:id', protect, authorize('Student'), editLeave);
router.delete('/:id', protect, authorize('Student'), cancelLeave);

router.get('/queue', protect, authorize('Coordinator', 'HOD'), getQueue);
router.put('/:id/process', protect, authorize('Coordinator', 'HOD'), processLeave);
router.get('/student/:id', protect, authorize('Coordinator', 'HOD'), getStudentHistory);

module.exports = router;
