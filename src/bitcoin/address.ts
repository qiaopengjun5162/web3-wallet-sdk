import * as bitcoin from 'bitcoinjs-lib';
const ecc = require('tiny-secp256k1');
const { BIP32Factory } = require('bip32');
const bip32 = BIP32Factory(ecc);

export interface AddressParams {
    seedHex: string; // 用于生成根密钥的种子，十六进制字符串
    receiveOrChange: '0' | '1'; // 限制为 '0' 或 '1'
    addressIndex: number;
    network: 'bitcoin' | 'testnet' | 'regtest'; // Bitcoin or Testnet
    method: 'p2pkh' | 'p2wpkh' | 'p2sh'; // Supported address generation methods
}


interface AddressResult {
    privateKey: string;
    publicKey: string;
    address: string;
}

export function createAddress(params: AddressParams): AddressResult {
    const { seedHex, receiveOrChange, addressIndex, network, method } = params;

    // 验证输入参数
    if (!['0', '1'].includes(receiveOrChange)) {
        throw new Error('Invalid value for receiveOrChange: must be "0" or "1".');
    }
    if (!['bitcoin', 'testnet', 'regtest'].includes(network)) {
        throw new Error('Unsupported network: ' + network);
    }
    if (!['p2pkh', 'p2wpkh', 'p2sh'].includes(method)) {
        throw new Error('Unsupported method: ' + method);
    }

    // Derive root from seed
    const root = bip32.fromSeed(Buffer.from(seedHex, 'hex'));
    // Build path
    // let path = "m/44'/0'/0'/0/" + addressIndex + '';
    // if (receiveOrChange === '1') {
    //     path = "m/44'/0'/0'/1/" + addressIndex + '';
    // }
    const path = `m/44'/0'/0'/${receiveOrChange}/${addressIndex}`;

    const child = root.derivePath(path);
    // 确保子密钥包含私钥
    if (!child.privateKey) {
        throw new Error('Failed to derive private key from seed.');
    }

    let address: string;
    // Generate address based on the method
    switch (method) {
        case 'p2pkh':
            // eslint-disable-next-line no-case-declarations
            const p2pkhAddress = bitcoin.payments.p2pkh({
                pubkey: child.publicKey,
                network: bitcoin.networks[network]
            });
            address = p2pkhAddress.address!;
            break;
        case 'p2wpkh':
            // eslint-disable-next-line no-case-declarations
            const p2wpkhAddress = bitcoin.payments.p2wpkh({
                pubkey: child.publicKey,
                network: bitcoin.networks[network]
            });
            address = p2wpkhAddress.address!;
            break;
        case 'p2sh':
            // eslint-disable-next-line no-case-declarations
            const p2shAddress = bitcoin.payments.p2sh({
                redeem: bitcoin.payments.p2wpkh({
                    pubkey: child.publicKey,
                    network: bitcoin.networks[network]
                })
            });
            address = p2shAddress.address!;
            break;
        default:
            console.log('This way can not support');
            throw new Error('Unsupported method: ' + method);
    }

    return {
        privateKey: Buffer.from(child.privateKey).toString('hex'),
        publicKey: Buffer.from(child.publicKey).toString('hex'),
        address
    };
}

export function createMultiSignAddress(params: {
    pubkeys: Buffer[];
    network: keyof typeof bitcoin.networks;
    method: 'p2pkh' | 'p2wpkh' | 'p2sh';
    threshold: number;
    }): string {
    const { pubkeys, network, method, threshold } = params;

    const commonRedeem = bitcoin.payments.p2ms({
        m: threshold,
        network: bitcoin.networks[network],
        pubkeys
    });

    switch (method) {
        case 'p2pkh':
            const p2pkhAddress = bitcoin.payments.p2sh({ redeem: commonRedeem });
            return p2pkhAddress.address!;
        case 'p2wpkh':
            const p2wpkhAddress = bitcoin.payments.p2wsh({ redeem: commonRedeem });
            return p2wpkhAddress.address!;
        case 'p2sh':
            const p2shAddress = bitcoin.payments.p2sh({
                redeem: bitcoin.payments.p2wsh({ redeem: commonRedeem })
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
    const { seedHex, receiveOrChange, addressIndex } = params;
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
    const { address } = bitcoin.payments.p2tr({
        internalPubkey: publicKey.length === 32 ? publicKey : publicKey.slice(1, 33)
    });

    return {
        privateKey: Buffer.from(childKey.privateKey).toString('hex'),
        publicKey: Buffer.from(childKey.publicKey).toString('hex'),
        address: address!
    };
}
