import {Keypair} from "@solana/web3.js";

const bs58 = require("bs58")
const bip39 =  require("bip39")
const { derivePath, getPublicKey } = require('ed25519-hd-key')


export function createHdWallet(): string {
    const generatedMnemonic = bip39.generateMnemonic()
    const seed = bip39.mnemonicToSeedSync(generatedMnemonic);
    const { key } = derivePath("m/44'/501'/1'/0'", seed.toString("hex"));
    const publicKey = getPublicKey(key, false).toString("hex")
    const buffer = Buffer.from(getPublicKey(key, false).toString("hex"), "hex");
    const address = bs58.encode(buffer)
    const hdWallet = {
        "mnemonic": generatedMnemonic,
        "publicKey": publicKey,
        "address": address,
    }
    return JSON.stringify(hdWallet)
}


export function createNormalWalet(): string {
    const keypairs = Keypair.generate();
    const secretKey = keypairs.secretKey
    let secretKeyHex = Buffer.from(secretKey).toString('hex');
    const normalWallet = {
        "privateKey": secretKeyHex,
        "publicKey": keypairs.publicKey.toString(),
        "address": bs58.encode(keypairs.publicKey.toBuffer()),
    }
    return JSON.stringify(normalWallet)
}


export function pubKeyToAddress({pubKey}): string {
    if (pubKey.length !== 64) {
        throw new Error("public key length Invalid");
    }
    const buffer = Buffer.from(pubKey, "hex");
    return bs58.encode(buffer);
}

export function privateKeyToAddress({privateKey}): string {
    const bufferPriv = Buffer.from(privateKey, "hex");
    const keypairs = Keypair.fromSecretKey(bufferPriv);
    return bs58.encode(keypairs.publicKey);
}
