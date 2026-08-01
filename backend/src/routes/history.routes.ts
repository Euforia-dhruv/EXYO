import { Router } from 'express';
import { HistoryController } from '../controllers/history.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', HistoryController.getHistory);
router.get('/continue-watching', HistoryController.getContinueWatching);
router.post('/', HistoryController.addOrUpdateHistory);
router.put('/:id', HistoryController.updateProgress);
router.delete('/:id', HistoryController.deleteHistoryItem);
router.delete('/', HistoryController.clearHistory);

export default router;
