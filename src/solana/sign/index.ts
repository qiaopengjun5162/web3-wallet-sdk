import * as SPLToken from "@solana/spl-token";
import {
    Keypair,
    NONCE_ACCOUNT_LENGTH,
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";

import bs58 from "bs58";
import { derivePath, getPublicKey } from "ed25519-hd-key";
import BigNumber from "bignumber.js";

export function createSolAddress(seedHex: string, addressIndex: string) {
    const { key } = derivePath("m/44'/501'/0'/" + addressIndex + "'", seedHex);
    const publicKey = getPublicKey(key, false).toString("hex");
    const buffer = Buffer.from(getPublicKey(key, false).toString("hex"), "hex");
    const address = bs58.encode(buffer);
    const hdWallet = {
        privateKey: key.toString("hex") + publicKey,
        publicKey,
        address,
    };
    return JSON.stringify(hdWallet);
}

export async function signSolTransaction(params: any) {
    const {
        from,
        amount,
        nonceAccount,
        to,
        mintAddress,
        nonce,
        decimal,
        privateKey,
    } = params;
    const fromAccount = Keypair.fromSecretKey(
        new Uint8Array(Buffer.from(privateKey, "hex")),
        { skipValidation: true }
    );
    const calcAmount = new BigNumber(amount)
        .times(new BigNumber(10).pow(decimal)).toNumber();
        
    // if (calcAmount.indexOf(".") !== -1) throw new Error("decimal 无效");
    const tx = new Transaction();
    const toPubkey = new PublicKey(to);
    const fromPubkey = new PublicKey(from);
    tx.recentBlockhash = nonce;
    if (mintAddress) {
        const mint = new PublicKey(mintAddress);
        const fromTokenAccount = await SPLToken.getAssociatedTokenAddress(
            mint,
            fromPubkey,
            false,
            SPLToken.TOKEN_PROGRAM_ID,
            SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID
        );
        const toTokenAccount = await SPLToken.getAssociatedTokenAddress(
            mint,
            toPubkey,
            false,
            SPLToken.TOKEN_PROGRAM_ID,
            SPLToken.ASSOCIATED_TOKEN_PROGRAM_ID
        );
        tx.add(
            SystemProgram.nonceAdvance({
                noncePubkey: new PublicKey(nonceAccount),
                authorizedPubkey: fromAccount.publicKey,
            }),
            SPLToken.createTransferInstruction(
                fromTokenAccount,
                toTokenAccount,
                fromPubkey, 
                calcAmount,
                [fromAccount],
                SPLToken.TOKEN_PROGRAM_ID
            )
        );
    } else {
        tx.add(
            SystemProgram.nonceAdvance({
                noncePubkey: new PublicKey(nonceAccount),
                authorizedPubkey: fromAccount.publicKey,
            }),
            SystemProgram.transfer({
                fromPubkey: fromAccount.publicKey,
                toPubkey: new PublicKey(to),
                lamports: calcAmount,
            })
        );
    }
    tx.sign(fromAccount);
    return tx.serialize().toString("base64");
}

export function prepareAccount(params: any) {
    const {
        authorAddress,
        from,
        recentBlockhash,
        minBalanceForRentExemption,
        privs,
    } = params;

    const authorPrivateKey = privs?.find(
        (ele: { address: any }) => ele.address === authorAddress
    )?.key;
    if (!authorPrivateKey) throw new Error("authorPrivateKey 为空");
    const nonceAcctPrivateKey = privs?.find(
        (ele: { address: any }) => ele.address === from
    )?.key;
    if (!nonceAcctPrivateKey) throw new Error("nonceAcctPrivateKey 为空");

    const author = Keypair.fromSecretKey(
        new Uint8Array(Buffer.from(authorPrivateKey, "hex"))
    );
    const nonceAccount = Keypair.fromSecretKey(
        new Uint8Array(Buffer.from(nonceAcctPrivateKey, "hex"))
    );

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
    tx.recentBlockhash = recentBlockhash;

    tx.sign(author, nonceAccount);
    return tx.serialize().toString("base64");
}

/**
 * address
 * network type
 * @param params
 */
export function verifySolAddress(params: any) {
    const { address } = params;
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function importSolAddress(params: any) {
    const { privateKey } = params;
    const keyPairs = Keypair.fromSecretKey(Buffer.from(privateKey, "hex"));
    return keyPairs.publicKey.toBase58();
}

// @ts-ignore
export function pubKeyToAddress({ pubKey }): string {
    if (pubKey.length !== 64) {
        throw new Error("public key length Invalid");
    }
    const buffer = Buffer.from(pubKey, "hex");
    return bs58.encode(buffer);
}

// https://solana.com/developers/cookbook/wallets/verify-keypair
// @ts-ignore
export function privateKeyToAddress({ privateKey }): string {
    const bufferPriv = Buffer.from(privateKey, "hex");
    const keypair = Keypair.fromSecretKey(bufferPriv);
    return keypair.publicKey.toBase58();
}
