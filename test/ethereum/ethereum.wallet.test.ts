const bip39 = require("bip39")
import {ethers} from 'ethers';
import {createEthAddress, importEthAddress, publicKeyToAddress, ethSign} from "@/ethereum";


describe('ethereum wallet test', () => {
    test('mpc public key to address', () => {
        const pubKeyPoint = [
            2, 211, 154, 205, 237, 94, 172, 44, 10, 252, 232, 165, 187, 22, 53, 235, 218, 108, 26, 42, 122, 130, 38, 45, 110, 233, 154, 55, 141, 135, 170, 96, 220
        ]
        const publicKeyHex = "0x" + Buffer.from(pubKeyPoint).toString("hex");
        const address = ethers.computeAddress(publicKeyHex);
        console.log("wallet address:", address);
    });

    test('createAddress', () => {
        const mnemonic = "champion junior low analyst plug jump entire barrel slight swim hidden remove";

        const seed = bip39.mnemonicToSeedSync(mnemonic)
        const account = createEthAddress(seed.toString("hex"), "0")

        console.log(account)
        // {
        // "address":"0x6Fe908602d5606D6a83257D3e054688c24E39072",
        // "publicKey":"0x0292f95b732a3085a0bd08c6bbadb8a04a32da974d4094d2fd9ee3ba2db175f8b5",
        // "privateKey":"0xdc2d6117326e9953bc997045df045ea87ebb1c974b49580fafa92fe9a7336ef9"
        // }
    });

    test('importEthAddress', () => {
        const privateKey = "0xdc2d6117326e9953bc997045df045ea87ebb1c974b49580fafa92fe9a7336ef9";

        const address = importEthAddress(privateKey)

        console.log(address)
    });

    test('publicKeyToAddress', () => {
        const publicKey = "0x0292f95b732a3085a0bd08c6bbadb8a04a32da974d4094d2fd9ee3ba2db175f8b5";

        const address = publicKeyToAddress(publicKey)

        console.log(address)
    })

    test('sign eth eip1559', async () => {
        const rawHex = ethSign({
            "privateKey": "0cbb2ff952da876c4779200c83f6b90d73ea85a8da82e06c2276a11499922720",
            "nonce": 8,
            "from": "0xcB1D7AeAa99344D2BEbA6a43BF778AF758568cCc",
            "to": "0xF60Eb3263C138525b6a324aFC9b93c610F60E833",
            "amount": "0.0001",
            "gasLimit": 21000,
            "maxFeePerGas": 20900000000,
            "maxPriorityFeePerGas": 2600000000,
            "decimal": 18,
            "chainId": 10,
            "tokenAddress": "0x00"
        })
        console.log("rawHex: " + JSON.stringify(rawHex))
    });

    test('sign usdt eip1559', async () => {
        const rawHex = ethSign({
            "privateKey": "",
            "nonce": 9,
            "from": "0xcB1D7AeAa99344D2BEbA6a43BF778AF758568cCc",
            "to": "0x0bb4311eb2181df2bfaa0729625ffcd1365eebdc",
            "amount": "2",
            "gasLimit": 120000,
            "maxFeePerGas": 20900000000,
            "maxPriorityFeePerGas": 2600000000,
            "decimal": 6,
            "chainId": 1,
            "tokenAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
        })
        console.log(rawHex)
    });
});