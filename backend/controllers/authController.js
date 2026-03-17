const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register initial HOD
// @route   POST /api/auth/register-hod
// @access  Public
const registerHOD = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const hodExists = await User.findOne({ role: 'HOD' });
        if (hodExists) {
            return res.status(400).json({ message: 'HOD registration is closed. Contact administrator.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const hod = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'HOD',
        });

        if (hod) {
            res.status(201).json({
                _id: hod._id,
                name: hod.name,
                email: hod.email,
                role: hod.role,
                token: generateToken(hod._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Coordinator or Student
// @route   POST /api/auth/create-user
// @access  Private
const createUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // Validation rules
        if (req.user.role === 'HOD' && role !== 'Coordinator') {
            return res.status(403).json({ message: 'HOD can only create Coordinators' });
        }
        if (req.user.role === 'Coordinator' && role !== 'Student') {
            return res.status(403).json({ message: 'Coordinator can only create Students' });
        }
        if (req.user.role === 'Student') {
            return res.status(403).json({ message: 'Students cannot create users' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            createdBy: req.user._id,
        });

        if (newUser) {
            res.status(201).json({
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users created by me
// @route   GET /api/auth/my-users
// @access  Private
const getMyUsers = async (req, res) => {
    try {
        const users = await User.find({ createdBy: req.user._id }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { registerHOD, login, createUser, getMyUsers };
