// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, getProfile,becomeTechnician, updateProfile} = require('../controllers/authcontroller');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const auth = require('../middleware/auth');

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

router.get('/profile', auth, getProfile)
router.put('/become-technician',auth,  becomeTechnician);
router.put('/profile', auth, updateProfile);

module.exports = router;