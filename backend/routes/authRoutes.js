const express = require('express');
const router = express.Router();
const { registerHOD, login, createUser, getMyUsers } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register-hod', registerHOD);
router.post('/login', login);
router.post('/create-user', protect, authorize('HOD', 'Coordinator'), createUser);
router.get('/my-users', protect, authorize('HOD', 'Coordinator'), getMyUsers);

module.exports = router;
