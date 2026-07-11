import express from 'express';
import { getRequests, updateRequestStatus, createRequest, deleteRequest } from '../controllers/requestController.js';

const router = express.Router();

router.post('/', createRequest);
router.get('/', getRequests);
router.put('/:id', updateRequestStatus);
router.delete('/:id', deleteRequest);

export default router;
