import primate from '@thewebchimp/primate';
import { router as solana } from './routes/solana.js';
primate.setup();
await primate.start();
primate.app.use('/solana', solana);
