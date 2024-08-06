import { getRouter } from '@thewebchimp/primate';
const router = getRouter();

router.get('/', (req, res) => {
	res.respond({
		data: {
			message: 'API is running like a charm! 🧙',
		},
	})
});
export { router };
