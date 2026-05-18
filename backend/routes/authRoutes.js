const express = require('express');
const router = express.Router();
const { registerHOD, login, createUser, getMyUsers, updateLeavePolicy, getLeavePolicy } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register-hod', registerHOD);
router.post('/login', login);
router.post('/create-user', protect, authorize('HOD', 'Coordinator'), createUser);
router.get('/my-users', protect, authorize('HOD', 'Coordinator'), getMyUsers);
router.put('/leave-policy', protect, authorize('Coordinator'), updateLeavePolicy);
router.get('/leave-policy', protect, getLeavePolicy);

module.exports = router;
