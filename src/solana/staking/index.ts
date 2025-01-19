import {Authorized, Keypair, Lockup, PublicKey, StakeProgram, Transaction} from "@solana/web3.js";

// 1. 创建质押账户
// 2. 把资金转入质押账户
// 3. 将质押权限委托给矿池节点
// 4. 把账户从 active 状态变成 inactive 状态

// 创建质押账户
export async function createAccount(params: { authorPrivateKey: any; stakeAccountPrivateKey: any; lamportsForStakeAccount: any; recentBlockhash: any; votePubkeyStr: any; }) {
    const {authorPrivateKey, stakeAccountPrivateKey, lamportsForStakeAccount, recentBlockhash, votePubkeyStr } = params
    let tx = new Transaction();
    const fromPublicKey = Keypair.fromSecretKey(new Uint8Array(Buffer.from(authorPrivateKey, "hex")));
    let authorizedAccount = fromPublicKey;
    const stakeAccount = Keypair.fromSecretKey(new Uint8Array(Buffer.from(stakeAccountPrivateKey, 'hex')), { skipValidation: true });
    let createAccountTransaction = StakeProgram.createAccount({
        fromPubkey: fromPublicKey.publicKey,
        authorized: new Authorized(authorizedAccount.publicKey, authorizedAccount.publicKey),
        lamports: lamportsForStakeAccount,
        lockup: new Lockup(0, 0, fromPublicKey.publicKey),
        stakePubkey: stakeAccount.publicKey
    });

    tx.add(createAccountTransaction)

    let votePubkey = new PublicKey(votePubkeyStr);
    let delegateTransaction = StakeProgram.delegate({
        authorizedPubkey: authorizedAccount.publicKey,
        stakePubkey: stakeAccount.publicKey,
        votePubkey: votePubkey,
    });

    tx.add(delegateTransaction)

    tx.recentBlockhash = recentBlockhash;
    tx.sign(fromPublicKey, stakeAccount);
    return tx.serialize().toString("base64")
}

// 转移投票权
export async function delegateStake(params: { authorPrivateKey: any; stakeAccountPrivateKey: any; votePubkeyStr: any; recentBlockhash: any; }) {
    const {authorPrivateKey, stakeAccountPrivateKey, votePubkeyStr, recentBlockhash } = params
    let tx = new Transaction()
    const stakeAccount = Keypair.fromSecretKey(new Uint8Array(Buffer.from(stakeAccountPrivateKey, 'hex')));

    const authorizedAccount = Keypair.fromSecretKey(new Uint8Array(Buffer.from(authorPrivateKey, 'hex')));

    let votePubkey = new PublicKey(votePubkeyStr);



    let delegateTransaction = StakeProgram.delegate({
        authorizedPubkey: authorizedAccount.publicKey,
        stakePubkey: stakeAccount.publicKey,
        votePubkey: votePubkey,
    });

    tx.add(delegateTransaction)
    tx.recentBlockhash = recentBlockhash;
    tx.sign(authorizedAccount, stakeAccount);
    return tx.serialize().toString("base64");
}


export function deactivateStake(params: { authorPrivateKey: any; stakeAccountPrivateKey: any; recentBlockhash: any; }) {
    const {authorPrivateKey, stakeAccountPrivateKey, recentBlockhash } = params
    let tx = new Transaction()
    const stakeAccount = Keypair.fromSecretKey(new Uint8Array(Buffer.from(stakeAccountPrivateKey, 'hex')), { skipValidation: true });

    const authorizedAccount = Keypair.fromSecretKey(new Uint8Array(Buffer.from(authorPrivateKey, 'hex')), { skipValidation: true });

    let deactivateTransaction = StakeProgram.deactivate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: authorizedAccount.publicKey,
    });

    tx.add(deactivateTransaction)
    tx.recentBlockhash = recentBlockhash;
    tx.sign(authorizedAccount, stakeAccount);
    return tx.serialize().toString("base64");
}


export function withdrawFunds(params: { authorPrivateKey: any; stakeAccountPrivateKey: any; stakeBalance: any; recentBlockhash: any; }) {
    const {authorPrivateKey, stakeAccountPrivateKey, stakeBalance, recentBlockhash } = params
    let tx = new Transaction()
    const authorizedAccount = Keypair.fromSecretKey(new Uint8Array(Buffer.from(authorPrivateKey, "hex")));

    const stakeAccount = Keypair.fromSecretKey(new Uint8Array(Buffer.from(stakeAccountPrivateKey, "hex")));

    const fromPublicKey = Keypair.fromSecretKey(new Uint8Array(Buffer.from(authorPrivateKey, "hex")));

    let withdrawTransaction = StakeProgram.withdraw({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: authorizedAccount.publicKey,
        toPubkey: fromPublicKey.publicKey,
        lamports: stakeBalance,
    });

    tx.add(withdrawTransaction)
    tx.recentBlockhash = recentBlockhash;
    tx.sign(authorizedAccount, stakeAccount);
    return tx.serialize().toString("base64");
}