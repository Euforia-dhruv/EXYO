import { Router } from 'express';
import { ContentController } from '../controllers/content.controller';

const router = Router();

router.get('/catalogs', ContentController.getCatalogs);
router.get('/search', ContentController.searchContent);
router.get('/manifest', ContentController.getManifest);
router.get('/:id', ContentController.getContentDetails);
router.get('/:id/streams', ContentController.getStreams);
router.get('/:id/subtitles', ContentController.getSubtitles);

export default router;
