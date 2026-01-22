// routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/permissionMiddleware');

// 1. Khách gửi liên hệ: Ai cũng làm được
router.post('/', contactController.createContact);

// 2. Các thao tác bên dưới chỉ dành cho Admin
router.use(protect, restrictTo(['admin'])); 

router.get('/', contactController.getAllContacts);


router.patch('/:id', contactController.updateContactStatus);


router.delete('/:id', contactController.deleteContact);

module.exports = router;