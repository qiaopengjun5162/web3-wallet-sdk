import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
// import Buffer = util.Buffer;
import {Buffer} from 'buffer';
import  {isValidAddress, verifyChecksum} from "@/cosmos/validator";
import {createSendMessage, createTxBody, createTxRawBytes}  from "@/cosmos/proto-tx-service";
import {getSignDoc, getAuthInfo, getDirectSignature} from "@/cosmos/post-ibc-signer";

const bip32 = BIP32Factory(ecc);
const {fromHex, toBase64} = require('@cosmjs/encoding');
const {
    Secp256k1Wallet,
    pubkeyToAddress: atomPubkeyToAddress
} = require('@cosmjs/amino');
const BigNumber = require('bignumber.js');




/**
 * Get address from seed
 * @param seedHex
 * @param addressIndex
 * @param _network
 * @returns
 */
// 将公钥-->base64 编码--> 根据编码判断是 secp256k1 还是 ed25519 的公钥---> sha256---->ripemd160---> bech32 编码
export async function createAtomAddress(seedHex: string, addressIndex: string, _network: string) {
    try {
        const node = bip32.fromSeed(Buffer.from(seedHex, 'hex'));
        const child = node.derivePath(`m/44'/118'/0'/0/${addressIndex}`);
        const publicKey = child.publicKey;
        const prefix = 'cosmos';
        const publicKeyHex = Buffer.from(publicKey).toString('hex');
        const pubkey = {
            type: 'tendermint/PubKeySecp256k1',
            value: toBase64(fromHex(publicKeyHex))
        };

        const address = atomPubkeyToAddress(pubkey, prefix);

        return {
            privateKey: child.privateKey ? Buffer.from(child.privateKey).toString('hex') : null,
            publicKey: Buffer.from(publicKey).toString('hex'),
            address
        };
    } catch (error) {
        console.error('Error creating Atom address:', error);
        throw error; // 或者根据需求进行更细致的错误处理
    }
}


export function publicKeyToAddress(publicKey: string): string {
    const prefix = 'cosmos';
    const pubkey = {
        type: 'tendermint/PubKeySecp256k1',
        value: toBase64(
            fromHex(publicKey)
        )
    };
    return atomPubkeyToAddress(pubkey, prefix);
}

/**
 * sign transaction
 * @param params
 * @returns
 */
export async function signAtomTransaction(params: any): Promise<string> {
    const {privateKey, chainId, from, to, memo, amount, fee, gas, accountNumber, sequence, decimal} = params;
    const calcAmount = new BigNumber(amount).times(new BigNumber(10).pow(decimal)).toNumber();
    if (calcAmount % 1 !== 0) throw new Error('amount invalid');
    const calcFee = new BigNumber(fee).times(new BigNumber(10).pow(decimal)).toNumber();
    if (calcFee % 1 !== 0) throw new Error('fee invalid');
    const signDoc = {
        msgs: [
            {
                type: 'cosmos-sdk/MsgSend',
                value: {
                    from_address: from,
                    to_address: to,
                    amount: [{amount: BigNumber(amount).times(Math.pow(10, decimal)).toString(), denom: 'uatom'}]
                }
            }
        ],
        fee: {
            amount: [{amount: BigNumber(fee).times(Math.pow(10, decimal)).toString(), denom: 'uatom'}],
            gas: String(gas)
        },
        chain_id: chainId,
        memo: memo || '',
        account_number: accountNumber.toString(),
        sequence: sequence.toString()
    };
    const signer = await Secp256k1Wallet.fromKey(new Uint8Array(Buffer.from(privateKey, 'hex')), 'cosmos');
    const {signature} = await signer.signAmino(from, signDoc);
    const tx = {
        tx: {
            msg: signDoc.msgs,
            fee: signDoc.fee,
            signatures: [signature],
            memo: memo || ''
        },
        mode: 'sync'
    };
    return JSON.stringify(tx);
}

/**
 * address
 * network type
 * @param params
 */
export function verifyAtomAddress(params: any) {
    const {address} = params;
    const regex = new RegExp('^cosmos[a-zA-Z0-9]{39}$');
    return regex.test(address);
}

/**
 * import address
 * private key
 * network
 * @param params
 */
export async function importAtomAddress(params: any) {
    const {privateKey} = params;
    const accounts = await Secp256k1Wallet.fromKey(new Uint8Array(Buffer.from(privateKey, 'hex')), 'cosmos');
    const accountList = await accounts.getAccounts();
    const address = accountList[0].address;
    return {
        privateKey,
        address
    };
}


export async function SignV2Transaction(params: any): Promise<string> {
    const {chainId, from, to, memo, amount_in, fee, gas, accountNumber, sequence, decimal, privateKey} = params;

    const amount = BigNumber(amount_in).times(Math.pow(10, decimal)).toString();
    const feeAmount = BigNumber(fee).times(Math.pow(10, decimal)).toString();
    const unit = "uatom";
    if (amount.toString().indexOf(".") !== -1) {
        throw new Error('input amount value invalid.');
    }
    if (feeAmount.toString().indexOf(".") !== -1) {
        throw new Error('input amount value invalid.');
    }
    // if (!verifyAddress({address: from}) || !verifyAddress({address: to})) {
    //     throw new Error('input address value invalid.');
    // }
    const sendMessage = createSendMessage(
        from,
        to,
        amount,
        unit
    );
    const messages = [sendMessage];
    const txBody = createTxBody(messages, memo);
    const {pubkey} = await Secp256k1Wallet.fromKey(
        fromHex(privateKey),
        "cosmos"
    );
    const authInfo = await getAuthInfo(
        pubkey,
        sequence.toString(),
        feeAmount,
        unit,
        gas
    );
    const signDoc = getSignDoc(chainId, txBody, authInfo, accountNumber);
    const signature = getDirectSignature(signDoc, fromHex(privateKey));
    const txRawBytes = createTxRawBytes(
        txBody,
        authInfo,
        signature
    );
    const txBytesBase64 = Buffer.from(txRawBytes, 'binary').toString('base64');
    const txRaw = {tx_bytes: txBytesBase64, mode: "BROADCAST_MODE_SYNC"};
    return JSON.stringify(txRaw);
}


function verifyAddress(params: any): boolean {
    const {address} = params;
    try {
        if (!isValidAddress(address) || !verifyChecksum(address)) return false;
        return true;
    } catch (error) {
        return false;
    }
}