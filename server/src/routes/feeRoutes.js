import express from 'express';
import { getFees, createFee, updateFee } from '../controllers/feeController.js';

const router = express.Router();

router.get('/', getFees);
router.post('/', createFee);
router.put('/:id', updateFee);

export default router;
