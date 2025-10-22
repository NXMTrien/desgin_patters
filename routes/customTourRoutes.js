// routes/customTourRoutes.js
const express = require('express');
const router = express.Router();
const customTourController = require('../controllers/customTourController');
const { protect} = require('../middleware/authMiddleware');
const { checkAdmin } = require('../controllers/authControllers'); 
const {
    getAllRequests,
    updateRequestStatus
} = customTourController;



router.post('/', protect, customTourController.createCustomTour);


router.get('/predefined', customTourController.getPredefinedTour);

router.put('/:id/confirm', protect, checkAdmin, customTourController.confirmCustomTour);

router.get('/', protect, checkAdmin, getAllRequests); 
router.put('/:id', protect, checkAdmin, updateRequestStatus); 


module.exports = router;