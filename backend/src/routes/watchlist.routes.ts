import { Router } from 'express';
import { WatchlistController } from '../controllers/watchlist.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', WatchlistController.getWatchlist);
router.post('/', WatchlistController.addToWatchlist);
router.delete('/:id', WatchlistController.removeFromWatchlist);
router.get('/check/:contentId', WatchlistController.checkWatchlist);

export default router;
