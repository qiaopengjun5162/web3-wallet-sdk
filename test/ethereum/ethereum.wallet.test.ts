import {
    createEthAddress,
    ethSign,
    importEthAddress,
    verifyETHAddress,
    publicKeyToAddress,
} from "@/ethereum";
import { Chain, CustomChain } from "@ethereumjs/common";
import { ethers } from "ethers";
import * as bip39 from "bip39";

describe("ethereum wallet test", () => {
    test("mpc public key to address", () => {
        const pubKeyPoint = [
            2, 211, 154, 205, 237, 94, 172, 44, 10, 252, 232, 165, 187, 22, 53, 235,
            218, 108, 26, 42, 122, 130, 38, 45, 110, 233, 154, 55, 141, 135, 170, 96,
            220,
        ];
        const publicKeyHex = "0x" + Buffer.from(pubKeyPoint).toString("hex");
        const address = ethers.computeAddress(publicKeyHex);
        console.log("wallet address:", address);
    });

    test("createAddress", () => {
        const mnemonic =
            "champion junior low analyst plug jump entire barrel slight swim hidden remove";

        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const accountInfo = createEthAddress(seed.toString("hex"), "0");

        console.log("accountInfo:", accountInfo);
        // {
        // "address":"0x6Fe908602d5606D6a83257D3e054688c24E39072",
        // "publicKey":"0x0292f95b732a3085a0bd08c6bbadb8a04a32da974d4094d2fd9ee3ba2db175f8b5",
        // "privateKey":"0xdc2d6117326e9953bc997045df045ea87ebb1c974b49580fafa92fe9a7336ef9"
        // }
    });

    test("importEthAddress", () => {
        const privateKey =
            "0xdc2d6117326e9953bc997045df045ea87ebb1c974b49580fafa92fe9a7336ef9";

        const address = importEthAddress(privateKey);
        // {"privateKey":"dc2d6117326e9953bc997045df045ea87ebb1c974b49580fafa92fe9a7336ef9","address":"0x6Fe908602d5606D6a83257D3e054688c24E39072"}
        console.log(address);
    });

    test("verifyETHAddress", () => {
        const address = "0x6Fe908602d5606D6a83257D3e054688c24E39072";
        const isOk = verifyETHAddress(address);
        console.log(isOk);
    });

    test("publicKeyToAddress", () => {
        const publicKey =
            "0x0292f95b732a3085a0bd08c6bbadb8a04a32da974d4094d2fd9ee3ba2db175f8b5";

        const address = publicKeyToAddress(publicKey);

        console.log(address);
        // 0x6Fe908602d5606D6a83257D3e054688c24E39072
    });

    // https://docs.web3js.org/api/web3-eth-accounts/enum/CustomChain/#OptimisticEthereum
    test("sign eth eip1559", async () => {
        const rawHex = ethSign({
            privateKey:
                "dc2d6117326e9953bc997045df045ea87ebb1c974b49580fafa92fe9a7336ef9",
            nonce: 8,
            from: "0xcB1D7AeAa99344D2BEbA6a43BF778AF758568cCc",
            to: "0xF60Eb3263C138525b6a324aFC9b93c610F60E833",
            amount: "0.0001",
            gasLimit: 21000,
            maxFeePerGas: 20900000000,
            maxPriorityFeePerGas: 2600000000,
            decimal: 18,
            chainId: CustomChain.OptimisticEthereum,
            tokenAddress: "0x00",
        });

        console.log("rawHex: " + rawHex);
        /*
            0x02f8b10109849af8da008504ddbcb1008301d4c094dac17f958d2ee523a2206206994597c13d831ec780b844a9059cbb0000000000000000000000000bb4311eb2181df2bfaa0729625ffcd1365eebdc00000000000000000000000000000000000000000000000000000000001e8480c001a04241dd658aa8df685cb44ab6e7c6c5ab7086b85f1e62287de13617c8506c770aa0666c710637ea9b6dd11348ed42b1df81c2f1a3822f5752f6b8e8ef3d697de5ce-
            0x02f8710a08849af8da008504ddbcb10082520894f60eb3263c138525b6a324afc9b93c610f60e833865af3107a400080c001a05cd19ef77739d920069bef25a6250ecfe48a0ee135654d6829a2fa5103672750a053a4db5fc30f77a65465bcaba94b1581d17dc7a4ab219fd315498b00fc1bb776
    
             */
    });

    test("sign eth2 eip1559", async () => {
        const rawHex = ethSign({
            privateKey:
                "a482a7dd30e44b8d18ded0ffe6ea0336d46cfad74c22da6a29686b8bdf344bd1",
            nonce: 7,
            from: "0xcB1D7AeAa99344D2BEbA6a43BF778AF758568cCc",
            to: "0xF60Eb3263C138525b6a324aFC9b93c610F60E833",
            amount: "0.0001",
            gasLimit: 21000,
            gasPrice: 20520000,
            decimal: 18,
            chainId: Chain.Mainnet,
            tokenAddress: "0x00",
        });
        console.log("rawHex: " + rawHex);
        // 0xf869078401391c4082520894f60eb3263c138525b6a324afc9b93c610f60e833865af3107a40008025a0fe1f532d00cc62c61ae695d93a68079b7b5e9df74537b539e593e3a30052b864a05d1158a64d08f9269eb807e38773bb771014b9c4d5c2705b4a1f00f6f59db5b5
    });

    test("sign usdt eip1559", async () => {
        const rawHex = ethSign({
            privateKey:
                "a482a7dd30e44b8d18ded0ffe6ea0336d46cfad74c22da6a29686b8bdf344bd1",
            nonce: 7,
            from: "0xcB1D7AeAa99344D2BEbA6a43BF778AF758568cCc",
            to: "0x0bb4311eb2181df2bfaa0729625ffcd1365eebdc",
            amount: "2",
            gasLimit: 120000,
            maxFeePerGas: 20900000000,
            maxPriorityFeePerGas: 2600000000,
            decimal: 6,
            chainId: 1,
            tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        });
        console.log("sign usdt eip1559: " + rawHex);
        // sign usdt eip1559: 0x02f8b10107849af8da008504ddbcb1008301d4c094dac17f958d2ee523a2206206994597c13d831ec780b844a9059cbb0000000000000000000000000bb4311eb2181df2bfaa0729625ffcd1365eebdc00000000000000000000000000000000000000000000000000000000001e8480c001a0cf66953316ab9dcbf0932eb89cfbc609baf83d5f666bbe7b2095d51992699d05a07bb62f944ddfc97822788b19d13fddbd329ad668574fd86702076a66b57eec9e
    });
});
