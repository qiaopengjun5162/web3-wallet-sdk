// import { Keypair, NONCE_ACCOUNT_LENGTH, SystemProgram, Transaction } from "@solana/web3.js";

const { Keypair, NONCE_ACCOUNT_LENGTH, SystemProgram, Transaction, PublicKey, SPLToken } = require("@solana/web3.js");


const { derivePath, getPublicKey } = require('ed25519-hd-key');
const bs58 = require('bs58');
const BigNumber = require('bignumber.js');

const staking = "STAKING";
const createStakeDelegate = "CREATE_STAKE_DELEGATE";
const unstakeAll = "UNSTAKE_ALL";
const withdrawAll = "WITHDRAW_ALL";

export function createSolHdAddress(seedHex: string, addressIndex: string): string {
    const path = "m/44'/501'/0'/" + addressIndex + "'";
    const { key } = derivePath(path, seedHex);
    const publicKey = getPublicKey(new Uint8Array(key), false).toString('hex');
    const buffer = Buffer.from(getPublicKey(new Uint8Array(key), false).toString('hex'), 'hex');
    const address = bs58.encode(buffer);
    const account = {
        address,
        publicKey,
        privateKey: key.toString('hex')
    }
    return JSON.stringify(account);
}

export function prepareAccount(params: any): string {
    const {
        authorAddress, from, recentBlockhash, minBalanceForRentExemption, privs
    } = params;

    const authorPrivateKey = (privs?.find(ele => ele.address === authorAddress))?.key;
    if (!authorPrivateKey) throw new Error("authorPrivateKey is not found");
    const nonceAccountPrivateKey = (privs?.find(ele => ele.address === from))?.key;
    if (!nonceAccountPrivateKey) throw new Error("nonceAccountPrivateKey is not found");

    const author = Keypair.fromSecretKey(new Uint8Array(Buffer.from(authorPrivateKey, "hex")));
    // 1. Create a nonce account 
    const nonceAccount = Keypair.fromSecretKey(new Uint8Array(Buffer.from(nonceAccountPrivateKey, "hex")));

    // 2. Create a transaction to create the nonce account
    let tx = new Transaction();
    tx.add(
        SystemProgram.createAccount({
            fromPubkey: author.publicKey,
            newAccountPubkey: nonceAccount.publicKey,
            lamports: minBalanceForRentExemption,
            space: NONCE_ACCOUNT_LENGTH,
            programId: SystemProgram.programId,
        }),
        SystemProgram.nonceInitialize({
            noncePubkey: nonceAccount.publicKey,
            authorizedPubkey: author.publicKey,
        })
    );
    tx.recentBlockHash = recentBlockhash;
    tx.sign(author, nonceAccount);
    const serializeMsg = tx.serialize().toString("base64");
    return serializeMsg;
}

export async function signTransaction(params: any): Promise<string> {
    const {
        txObj: {
            from, amount, to, nonce, nonceAccountAddress, authorAddress, stakeAddress, decimal, txType, mintAddress, hasCreatedTokenAddr, validator, blindType, stakingType }, privs,

    } = params;

    const privateKey = (privs?.find((ele: { address: any; }) => ele.address === from))?.key;
    if (!privateKey) throw new Error("Private key not found");
    const authorPrivateKey = (privs?.find((ele: { address: any; }) => ele.address === authorAddress))?.key;
    if (!authorPrivateKey) throw new Error("Author private key not found");

    const feePayer = Keypair.fromSecretKey(new Uint8Array(Buffer.from(privateKey, "hex")));
    const author = Keypair.fromSecretKey(new Uint8Array(Buffer.from(authorPrivateKey, "hex")));

    const calcAmount = new BigNumber(amount).times(new BigNumber(10).pow(decimal)).toString();
    if (calcAmount.indexOf(".") != -1) throw new Error("Amount must be integer");

    let tx = new Transaction();
    let tx1 = new Transaction();
    tx.recentBlockHash = nonce;

    const toPubkey = new PublicKey(to);
    const fromPubkey = new PublicKey(from);

    if (blindType === staking) {

    } else {
        if (txType === "TRANSFER_TOKEN") {
            const mint = new PublicKey(mintAddress);
            const fromTokenAccount = await SPLToken.Token.getAssociatedTokenAddress(
                SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID,
                SPLToken.TOKEN_PROGRAM_ID,
                mint,
                fromPubkey
            );

            const toTokenAccount = await SPLToken.Token.getAssociatedTokenAddress(
                SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID,
                SPLToken.TOKEN_PROGRAM_ID,
                mint,
                toPubkey
            );

            tx.add(
                SystemProgram.nonceAdvance({
                    noncePubkey: new PublicKey(nonceAccountAddress),
                    authorizedPubkey: author.publicKey,
                }),
                SPLToken.Token.createAssociatedTokenAccountInstruction(
                    SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID,
                    SPLToken.TOKEN_PROGRAM_ID,
                    mint,
                    toTokenAccount,
                    toPubkey,
                    feePayer.publicKey
                ),
                SPLToken.Token.createTransferInstruction(
                    SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID,
                    fromTokenAccount,
                    toTokenAccount,
                    fromPubkey,
                    [feePayer, author],
                    calcAmount,
                )
            )

            if (!hasCreatedTokenAddr) {
                tx1.add(
                SystemProgram.nonceAdvance({
                    noncePubkey: new PublicKey(nonceAccountAddress),
                    authorizedPubkey: author.publicKey,
                }),
                    SPLToken.Token.createAssociatedTokenAccountInstruction(
                        SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID,
                        SPLToken.TOKEN_PROGRAM_ID,
                        mint,
                        toTokenAccount,
                        toPubkey,
                        feePayer.publicKey
                    ),
                    SPLToken.Token.createTransferInstruction(
                        SPLToken.TOKEN_PROGRAM_ID,
                        fromTokenAccount,
                        toTokenAccount,
                        fromPubkey,
                        [feePayer, author],
                        calcAmount,
                    )
                );
            }
        } else {
            tx.add(
                // SystemProgram.nonceAdvance({
                //     noncePubkey: new PublicKey(nonceAccountAddress),
                //     authorizedPubkey: author.publicKey,
                // }
                // )
                SystemProgram.transfer({
                    fromPubkey: feePayer.publicKey,
                    toPubkey: toPubkey,
                    lamports: calcAmount,
                })
            )

        }
        tx.sign(feePayer, author);
    }
    const serializeMsg = tx.serialize().toString("base64");
    if (txType === "TRANSFER_TOKEN") {
        if (!hasCreatedTokenAddr) {
            tx1.recentBlockhash = nonce
            tx1.sign(feePayer, author)
            const serializeMsg1 = tx.serialize().toString("base64")
            return JSON.stringify([serializeMsg1, serializeMsg])
        } else {
            return JSON.stringify([serializeMsg])
        }
    }
    return serializeMsg;
}
