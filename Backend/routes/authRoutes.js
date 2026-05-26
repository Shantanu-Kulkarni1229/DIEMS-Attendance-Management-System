const express = require('express');
const router = express.Router();
const { login, me, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/me', protect, me);
router.patch('/change-password', protect, changePassword);

module.exports = router;
