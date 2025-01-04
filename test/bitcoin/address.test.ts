// @ts-ignore
import * as bip39 from '@/bip39/bip39';
import {AddressParams, createAddress} from "@/bitcoin/address";
import * as assert from 'assert';
import * as bitcoin from 'bitcoinjs-lib'; // 确保导入了bitcoinjs-lib


describe("Address test", () => {
    test("hello world", () => {
        console.log("hello world")
    });

    test('createAddress by p2pkh mainnet', () => {
        const mnemonic = "around dumb spend sample oil crane plug embrace outdoor panel rhythm salon";
        const seed = bip39.mnemonicToSeedSync(mnemonic, "")
        const param: AddressParams = {
            seedHex: seed.toString("hex"),
            receiveOrChange: "0",
            addressIndex: 0,
            network: bitcoin.networks.bitcoin, // 使用bitcoinjs-lib中的网络对象
            method: "p2pkh"
        }
        const account = createAddress(param)
        if ('error' in account) {
            console.error(account.error);
            assert.fail('Expected a valid address result, but got an error');
        } else {
            console.log(account.address);
            assert.strictEqual(account.address, '1H7AcqzvVQunYftUcJMxF9KUrFayEnf83T');
            // assert.strictEqual(account.privateKey, '60164bec9512d004af7f71e7ed868c8e9ac2cc6234d8b682037ec80547595f2e');
            // assert.strictEqual(account.publicKey, '030e93482fd0037d589b08c36bb22afc041338ba444f9f9d7ba129348f9be731c1');
        }
    });

    test('test create mnemonic', async () => {
        const english_mnemonic = bip39.createMnemonic(12, "english")
        console.log(english_mnemonic);

        // const encrpytCode = bip39.mnemonicToEntropy(english_mnemonic, "english")
        // console.log(encrpytCode);  // 1075d6d2463c34e610adc2b9d8ca29ea

        // const decodeCode = bip39.entropyToMnemonic(encrpytCode, "english")
        // console.log(decodeCode)

        // const seed = await bip39.mnemonicToSeed(english_mnemonic, "")
        // console.log(seed)  // Bip32 导出 rootKey

    });
})









