import primate from '@thewebchimp/primate';
import { router as defaultRouter } from './routes/default.js';
primate.setup();
await primate.start();
primate.app.use('/', defaultRouter);
