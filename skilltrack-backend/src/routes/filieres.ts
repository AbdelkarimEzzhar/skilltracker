import { Router } from 'express';
import { getAllFilieres } from '../controllers/filieres';

const router = Router();

router.get('/', getAllFilieres);

export default router;
