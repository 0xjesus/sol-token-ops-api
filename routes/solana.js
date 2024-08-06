import { getRouter } from '@thewebchimp/primate';
import SolanaController from '../controllers/solana.controller.js';

const router = getRouter();

router.post('/create-token', SolanaController.createToken);
router.post('/mint-token', SolanaController.mintToken);
router.post('/transfer-token', SolanaController.transferToken);
router.post('/burn-token', SolanaController.burnToken);
router.post('/delegate-token', SolanaController.delegateToken);

export { router };
