import { getRouter } from '@thewebchimp/primate';
const router = getRouter();

router.get('/', (req, res) => {
	res.send('Hello SOLANA!');
});
export { router };
