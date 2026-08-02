import { Router } from 'express';
import { AddonController } from '../controllers/addon.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', AddonController.getAddons);
router.post('/', AddonController.addAddon);
router.delete('/:id', AddonController.removeAddon);
router.patch('/:id/toggle', AddonController.toggleAddon);

export default router;
