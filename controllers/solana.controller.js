import SolanaService from '../services/solana.service.js';

class SolanaController {
	static async createToken(req,res) {
		const {payer,decimals} = req.body.params;
		if (!payer || !decimals) {
			return res.respond({
				status:400,
				message:'Missing parameters for token creation',
			})
		}
		try {
			const {encodedTransaction,mintPublicKey} = await SolanaService.createToken(payer,decimals);
			res.respond({
				status:200,
				data:{encodedTransaction,mintPublicKey},
			})
		} catch (error) {
			res.respond({
				status:500,
				message:error.message,
			})
		}
	}

	static async mintToken(req,res) {
		const {payer,mintAddress,recipientAddress,amount} = req.body.params;
		if (!payer || !mintAddress || !recipientAddress || !amount) {
			return res.respond({
				status:400,
				message:'Missing parameters for minting',
			})
		}
		try {
			const encodedTransaction = await SolanaService.mintToken(payer,mintAddress,recipientAddress,amount);
			res.respond({
				status:200,
				data:{encodedTransaction},
			})
		} catch (error) {
			console.error('Error minting token:',error);
			res.respond({
				status:500,
				message:error.message,
			})
		}
	}

	static async transferToken(req,res) {
		const {payer,fromAddress,toAddress,mintAddress,amount} = req.body.params;
		if (!payer || !fromAddress || !toAddress || !mintAddress || !amount) {
			return res.respond({
				status:400,
				message:'Missing parameters for transfer',
			})
		}
		try {
			const encodedTransaction = await SolanaService.transferToken(payer,fromAddress,toAddress,mintAddress,amount);
			res.respond({
				status:200,
				data:{encodedTransaction},
			})
		} catch (error) {
			res.respond({
				status:500,
				message:error.message
			})
		}
	}

	static async burnToken(req,res) {
		const {payer,accountAddress,mintAddress,amount} = req.body.params;
		if (!payer || !accountAddress || !mintAddress || !amount) {
			return res.respond({
				status:400,
				message:'Missing parameters for burning',
			})
		}
		try {
			const encodedTransaction = await SolanaService.burnToken(payer,accountAddress,mintAddress,amount);
			res.respond({
				status:200,
				data:{encodedTransaction},
			})
		} catch (error) {
			res.status(500).json({error:error.message});
		}
	}

	static async delegateToken(req,res) {
		const {payer,ownerAddress,delegateAddress,mintAddress,amount} = req.body.params;
		if (!payer || !ownerAddress || !delegateAddress || !mintAddress || !amount) {
			return res.respond({
				status:400,
				message:'Missing parameters for approval',
			})
		}
		try {
			const encodedTransaction = await SolanaService.delegateToken(payer,ownerAddress,delegateAddress,mintAddress,amount);
			res.respond({
				status:200,
				data:{encodedTransaction},
			});
		} catch (error) {
			res.respond({
				status:500,
				message:error.message,
			})
		}
	}

}

export default SolanaController;
