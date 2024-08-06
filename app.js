import primate from '@thewebchimp/primate';
import { router as solana } from './routes/solana.js';
import {router as defaultRouter} from './routes/default.js';
primate.setup();
await primate.start();
primate.app.use('/solana', solana);
primate.app.use('/', defaultRouter);
