import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', SearchController.getSearchHistory);
router.post('/', SearchController.saveSearch);
router.delete('/', SearchController.clearSearchHistory);

export default router;
