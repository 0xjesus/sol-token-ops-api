import {Connection,PublicKey,SystemProgram,Transaction} from '@solana/web3.js';
import {
	createApproveInstruction,
	createAssociatedTokenAccountInstruction,
	createBurnInstruction,
	createCreateNativeMintInstruction,
	createMintToInstruction,
	createTransferInstruction,
	getAssociatedTokenAddress,
	TOKEN_PROGRAM_ID
} from '@solana/spl-token';


const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

class SolanaService {

	static async finalizeTransaction(transaction, payer) {
		const {blockhash} = await connection.getRecentBlockhash();
		transaction.recentBlockhash = blockhash;
		transaction.feePayer = new PublicKey(payer);
		const serializedTransaction = transaction.serialize({requireAllSignatures: false});
		return serializedTransaction.toString('base64');
	}

	static async createToken(payer, decimals) {
		const transaction = new Transaction();
		const payerPublicKey = new PublicKey(payer);
		const seed = "mint";
		const mintPublicKey = await PublicKey.createWithSeed(payerPublicKey, seed, TOKEN_PROGRAM_ID);
		const mintInstruction = createCreateNativeMintInstruction(
			payerPublicKey,
			mintPublicKey,
			SystemProgram.programId
		);
		transaction.add(mintInstruction);
		const encodedTransaction = await this.finalizeTransaction(transaction, payer);
		return {encodedTransaction, mintPublicKey};
	}

	static async mintToken(payer, mintAddress, recipientAddress, amount) {
		const transaction = new Transaction();
		const payerPublicKey = new PublicKey(payer);
		const mintPublicKey = new PublicKey(mintAddress);
		const recipientPublicKey = new PublicKey(recipientAddress);
		const recipientTokenAddress = await getAssociatedTokenAddress(
			mintPublicKey,
			recipientPublicKey
		);
		const recipientTokenAccountInfo = await connection.getAccountInfo(recipientTokenAddress);
		if (!recipientTokenAccountInfo) {
			const createRecipientTokenAccountInstruction = createAssociatedTokenAccountInstruction(
				payerPublicKey,
				recipientTokenAddress,
				recipientPublicKey,
				mintPublicKey
			);
			transaction.add(createRecipientTokenAccountInstruction);
		}
		const mintToInstruction = createMintToInstruction(
			mintPublicKey,
			recipientTokenAddress,
			payerPublicKey,
			amount,
			[]
		);
		transaction.add(mintToInstruction);
		return await this.finalizeTransaction(transaction,payer);
	}

	static async transferToken(payer, fromAddress, toAddress, mintAddress, amount) {
		const transaction = new Transaction();
		const fromPublicKey = new PublicKey(fromAddress);
		const toPublicKey = new PublicKey(toAddress);
		const mintPublicKey = new PublicKey(mintAddress);
		const payerPublicKey = new PublicKey(payer);
		const fromTokenAddress = await getAssociatedTokenAddress(
			mintPublicKey,
			fromPublicKey
		);
		const toTokenAddress = await getAssociatedTokenAddress(
			mintPublicKey,
			toPublicKey
		);
		const toTokenAccountInfo = await connection.getAccountInfo(toTokenAddress);
		if (!toTokenAccountInfo) {
			const createToTokenAccountInstruction = createAssociatedTokenAccountInstruction(
				payerPublicKey,
				toTokenAddress,
				toPublicKey,
				mintPublicKey
			);
			transaction.add(createToTokenAccountInstruction);
		}
		const transferInstruction = createTransferInstruction(
			fromTokenAddress,
			toTokenAddress,
			payerPublicKey,
			amount,
			[]
		);
		transaction.add(transferInstruction);
		return await this.finalizeTransaction(transaction,payer);
	}

	static async burnToken(payer, accountAddress, mintAddress, amount) {
		const transaction = new Transaction();
		const accountPublicKey = new PublicKey(accountAddress);
		const mintPublicKey = new PublicKey(mintAddress);
		const payerPublicKey = new PublicKey(payer);
		const burnInstruction = createBurnInstruction(
			accountPublicKey,
			mintPublicKey,
			payerPublicKey,
			amount,
			[]
		);
		transaction.add(burnInstruction);
		return await this.finalizeTransaction(transaction,payer);
	}

	static async delegateToken(payer, ownerAddress, delegateAddress, mintAddress, amount) {
		const transaction = new Transaction();
		const ownerPublicKey = new PublicKey(ownerAddress);
		const delegatePublicKey = new PublicKey(delegateAddress);
		const mintPublicKey = new PublicKey(mintAddress);
		const payerPublicKey = new PublicKey(payer);
		const tokenAccount = await getAssociatedTokenAddress(
			mintPublicKey,
			ownerPublicKey
		);
		const tokenAccountInfo = await connection.getAccountInfo(tokenAccount);
		if (!tokenAccountInfo) {
			const createTokenAccountInstruction = createAssociatedTokenAccountInstruction(
				payerPublicKey,
				tokenAccount,
				ownerPublicKey,
				mintPublicKey
			);
			transaction.add(createTokenAccountInstruction);
		}
		const approveInstruction = createApproveInstruction(
			tokenAccount,
			delegatePublicKey,
			ownerPublicKey,
			amount,
			[]
		);
		transaction.add(approveInstruction);
		return await this.finalizeTransaction(transaction,payer);
	}
}

export default SolanaService;
