import express from 'express';
import { getAdminProfile, updateAdminProfile } from '../controllers/adminController.js';

const router = express.Router();

router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);

export default router;
