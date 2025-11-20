import express from 'express';
import { SearchController } from '../controllers/search.controller.js';

const router = express.Router();

// POST /api/search
router.post('/', SearchController.getSearch);


export default router;
