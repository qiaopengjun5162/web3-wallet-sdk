import * as bitcoin from 'bitcoinjs-lib';
import {Network} from 'bitcoinjs-lib';

const ecc = require('tiny-secp256k1');
const {BIP32Factory} = require('bip32');
const bip32 = BIP32Factory(ecc);


export interface AddressParams {
    seedHex: string; // 用于生成根密钥的种子，十六进制字符串
    receiveOrChange: '0' | '1'; // 限制为 '0' 或 '1'
    addressIndex: number;
    network: Network;
    method: 'p2pkh' | 'p2wpkh' | 'p2sh'; // Supported address generation methods
    path?: string; // Optional BIP32 path, default is "m/44'/0'/0'"
}

interface AddressResult {
    privateKey: string;
    publicKey: string;
    address: string;
}


// 定义常量路径
const DEFAULT_PATH = "m/44'/0'/0'";

class InvalidInputError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidInputError';
    }
}

function validateSeedHex(seedHex: string): void {
    if (!/^([0-9a-fA-F]{2})+$/.test(seedHex)) {
        throw new InvalidInputError('Invalid seedHex format.');
    }
}

function validateAddressIndex(addressIndex: number): void {
    if (!Number.isInteger(addressIndex) || addressIndex < 0) {
        throw new InvalidInputError('Invalid addressIndex.');
    }
}

export function createAddress(params: AddressParams): AddressResult | { error: string } {
    try {
        // 参数验证
        validateSeedHex(params.seedHex);
        if (!['0', '1'].includes(params.receiveOrChange)) {
            throw new InvalidInputError('Invalid receiveOrChange value.');
        }
        validateAddressIndex(params.addressIndex);
        if (!params.network || !['p2pkh', 'p2wpkh', 'p2sh'].includes(params.method.toLowerCase())) {
            throw new InvalidInputError('Invalid network or method.');
        }

        const {seedHex, receiveOrChange, addressIndex, network, method, path = DEFAULT_PATH} = params;
        // 生成根节点
        const root = bip32.fromSeed(Buffer.from(seedHex, 'hex'));
        // 构建路径
        const fullPath = `${path}/${receiveOrChange}/${addressIndex}`;
        const child = root.derivePath(fullPath);

        if (!child.privateKey) {
            return {error: 'Failed to derive private key from seed.'};
        }
        const pubkey = Buffer.from(child.publicKey);

        let address: string;
        switch (method.toLowerCase()) {
            case 'p2pkh':
                address = generateP2PKHAddress(pubkey, network);
                break;
            case 'p2wpkh':
                address = generateP2WPKHAddress(pubkey, network);
                break;
            case 'p2sh':
                address = generateP2SHAddress(pubkey, network);
                break;
            default:
                return {error: `Unsupported method: ${method}`};
        }

        return {
            privateKey: Buffer.from(child.privateKey).toString('hex'),
            publicKey: Buffer.from(child.publicKey).toString('hex'),
            address
        };
    } catch (error) {
        if (error instanceof InvalidInputError) {
            return {error: error.message};
        }
        throw new Error(`Error creating address: ${(error as Error).message}`);
    }
}

function generateP2PKHAddress(pubkey: Buffer, network: any): string {
    const p2pkhAddress = bitcoin.payments.p2pkh({ pubkey, network });
    if (!p2pkhAddress.address) {
        throw new Error('Failed to generate P2PKH address.');
    }
    return p2pkhAddress.address;
}

function generateP2WPKHAddress(pubkey: Buffer, network: any): string {
    const p2wpkhAddress = bitcoin.payments.p2wpkh({ pubkey, network });
    if (!p2wpkhAddress.address) {
        throw new Error('Failed to generate P2WPKH address.');
    }
    return p2wpkhAddress.address;
}

function generateP2SHAddress(pubkey: Buffer, network: any): string {
    const p2shAddress = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({ pubkey, network })
    });
    if (!p2shAddress.address) {
        throw new Error('Failed to generate P2SH address.');
    }
    return p2shAddress.address;
}


export function createMultiSignAddress(params: {
    pubkeys: Buffer[];
    network: keyof typeof bitcoin.networks;
    method: 'p2pkh' | 'p2wpkh' | 'p2sh';
    threshold: number;
}): string {
    const {pubkeys, network, method, threshold} = params;

    const commonRedeem = bitcoin.payments.p2ms({
        m: threshold,
        network: bitcoin.networks[network],
        pubkeys
    });

    switch (method) {
        case 'p2pkh':
            const p2pkhAddress = bitcoin.payments.p2sh({redeem: commonRedeem});
            return p2pkhAddress.address!;
        case 'p2wpkh':
            const p2wpkhAddress = bitcoin.payments.p2wsh({redeem: commonRedeem});
            return p2wpkhAddress.address!;
        case 'p2sh':
            const p2shAddress = bitcoin.payments.p2sh({
                redeem: bitcoin.payments.p2wsh({redeem: commonRedeem})
            });
            return p2shAddress.address!;
        default:
            console.log('This way can not support');
            return '0x00';
    }
}


export function createSchnorrAddress(params: {
    seedHex: string;
    receiveOrChange: '0' | '1';
    addressIndex: number;
}): { privateKey: string; publicKey: string; address: string } {
    bitcoin.initEccLib(ecc);
    const {seedHex, receiveOrChange, addressIndex} = params;
    const root = bip32.fromSeed(Buffer.from(seedHex, 'hex'));
    // let path = "m/44'/0'/0'/0/" + addressIndex + '';
    // if (receiveOrChange === '1') {
    //     path = "m/44'/0'/0'/1/" + addressIndex + '';
    // }
    let path = `m/44'/0'/0'/${receiveOrChange === '1' ? 1 : 0}/${addressIndex}`;

    const childKey = root.derivePath(path);
    const privateKey = childKey.privateKey;
    if (!privateKey) throw new Error('No private key found');

    const publicKey = childKey.publicKey;

    // 生成 P2TR 地址
    const {address} = bitcoin.payments.p2tr({
        internalPubkey: publicKey.length === 32 ? publicKey : publicKey.slice(1, 33)
    });

    return {
        privateKey: Buffer.from(childKey.privateKey).toString('hex'),
        publicKey: Buffer.from(childKey.publicKey).toString('hex'),
        address: address!
    };
}
