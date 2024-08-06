import {Connection,Keypair,PublicKey,SystemProgram,Transaction} from '@solana/web3.js';
import {
	createApproveInstruction,
	createAssociatedTokenAccountInstruction,
	createBurnInstruction,
	createInitializeMintInstruction,
	createMintToInstruction,
	createTransferInstruction,
	getAssociatedTokenAddress,
	getMint,
	MINT_SIZE,
	TOKEN_PROGRAM_ID
} from '@solana/spl-token';

const connection = new Connection('https://api.devnet.solana.com','confirmed');

class SolanaService {

	static async finalizeTransaction(transaction,payer) {
		const {blockhash} = await connection.getRecentBlockhash();
		transaction.recentBlockhash = blockhash;
		transaction.feePayer = new PublicKey(payer);
		const serializedTransaction = transaction.serialize({requireAllSignatures:false});
		return serializedTransaction.toString('base64');
	}

	static async createToken(payer,decimals) {
		try {
			const transaction = new Transaction();
			const mintKeypair = Keypair.generate();
			const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

			const createAccountTx = SystemProgram.createAccount({
				fromPubkey:new PublicKey(payer),
				newAccountPubkey:mintKeypair.publicKey,
				lamports,
				space:MINT_SIZE,
				programId:TOKEN_PROGRAM_ID,
			});
			transaction.add(createAccountTx);

			const mintInstruction = createInitializeMintInstruction(
				mintKeypair.publicKey,
				decimals,
				new PublicKey(payer),
				new PublicKey(payer),
				TOKEN_PROGRAM_ID
			);
			transaction.add(mintInstruction);

			transaction.partialSign(mintKeypair);
			const encodedTransaction = await this.finalizeTransaction(transaction,payer);

			return {encodedTransaction,mintPublicKey:mintKeypair.publicKey.toString()};
		} catch (error) {
			console.error('Error creating token:',error);
			throw error;
		}
	}


	static async mintToken(payer,mintAddress,recipientAddress,amount) {
		try {
			const transaction = new Transaction();
			const payerPublicKey = new PublicKey(payer);
			const mintPublicKey = new PublicKey(mintAddress);
			const recipientPublicKey = new PublicKey(recipientAddress);
			const recipientTokenAddress = await getAssociatedTokenAddress(mintPublicKey,recipientPublicKey);

			// Fetch the mint information to get the number of decimals
			const mintInfo = await getMint(connection,mintPublicKey);
			const decimals = mintInfo.decimals;

			// Convert the amount to the correct decimal format
			const adjustedAmount = amount * Math.pow(10,decimals);

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
				adjustedAmount,
				[]
			);
			transaction.add(mintToInstruction);
			return await this.finalizeTransaction(transaction,payer);
		} catch (error) {
			console.error('Error minting token:',error);
			throw error;
		}
	}

	static async transferToken(payer,fromAddress,toAddress,mintAddress,amount) {
		try {
			const transaction = new Transaction();
			const fromPublicKey = new PublicKey(fromAddress);
			const toPublicKey = new PublicKey(toAddress);
			const mintPublicKey = new PublicKey(mintAddress);
			const payerPublicKey = new PublicKey(payer);
			const mintInfo = await getMint(connection,mintPublicKey);
			const decimals = mintInfo.decimals;
			const fromTokenAddress = await getAssociatedTokenAddress(mintPublicKey,fromPublicKey);
			const toTokenAddress = await getAssociatedTokenAddress(mintPublicKey,toPublicKey);
			const adjustedAmount = amount * Math.pow(10,decimals);
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
				adjustedAmount,
				[]
			);
			transaction.add(transferInstruction);

			return await this.finalizeTransaction(transaction,payer);
		} catch (error) {
			console.error('Error transferring token:',error);
			throw error;
		}
	}

	static async burnToken(payer,accountAddress,mintAddress,amount) {
		try {
			const transaction = new Transaction();
			const accountPublicKey = new PublicKey(accountAddress);
			const mintPublicKey = new PublicKey(mintAddress);
			const payerPublicKey = new PublicKey(payer);

			// Fetch the mint information to get the number of decimals
			const mintInfo = await getMint(connection,mintPublicKey);
			const decimals = mintInfo.decimals;

			// Convert the amount to the correct decimal format
			const adjustedAmount = amount * Math.pow(10,decimals);

			// Get associated token account
			const ata = await getAssociatedTokenAddress(mintPublicKey,accountPublicKey);
			const ataInfo = await connection.getAccountInfo(ata);

			// If the associated token account does not exist, create it
			if (!ataInfo) {
				const createTokenAccountInstruction = createAssociatedTokenAccountInstruction(
					payerPublicKey,
					ata,
					accountPublicKey,
					mintPublicKey
				);
				transaction.add(createTokenAccountInstruction);
			}

			// Create the burn instruction
			const burnInstruction = createBurnInstruction(
				ata, // Use the associated token account
				mintPublicKey,
				payerPublicKey,
				adjustedAmount,
				[]
			);
			transaction.add(burnInstruction);

			return await this.finalizeTransaction(transaction,payer);
		} catch (error) {
			console.error('Error burning token:',error);
			throw error;
		}
	}

	static async delegateToken(payer,ownerAddress,delegateAddress,mintAddress,amount) {
		try {
			const transaction = new Transaction();
			const ownerPublicKey = new PublicKey(ownerAddress);
			const delegatePublicKey = new PublicKey(delegateAddress);
			const mintPublicKey = new PublicKey(mintAddress);
			const payerPublicKey = new PublicKey(payer);
			const mintInfo = await getMint(connection,mintPublicKey);
			const decimals = mintInfo.decimals;
			const adjustedAmount = amount * Math.pow(10,decimals);
			const tokenAccount = await getAssociatedTokenAddress(mintPublicKey,ownerPublicKey);
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
				adjustedAmount,
				[]
			);
			transaction.add(approveInstruction);

			return await this.finalizeTransaction(transaction,payer);
		} catch (error) {
			console.error('Error delegating token:',error);
			throw error;
		}
	}
}

export default SolanaService;
