import { Chain, Common, CustomChain, Hardfork } from "@ethereumjs/common";
import { FeeMarketEIP1559Transaction, LegacyTransaction } from "@ethereumjs/tx";
import { bytesToHex } from "@ethereumjs/util";
import { PrefixedHexString } from "@ethereumjs/util/src/types";
import { Interface } from "@ethersproject/abi";

import * as ethers from "ethers";
import BigNumber from "bignumber.js";

export function numberToHex(value: number | BigNumber): string {
    const bigNumber = new BigNumber(value);

    // 验证输入
    if (bigNumber.isNaN() || !bigNumber.isFinite()) {
        console.error("Invalid number:", value);
        return "0x0"; // 返回默认值
    }

    // 转换为16进制字符串
    const result = bigNumber.toString(16);
    return result.startsWith("-") ? `-0x${result.slice(1)}` : `0x${result}`;
}

/**
 * Creates an Ethereum address from a given seed and address index.
 *
 * @param seedHex - The seed in hexadecimal format used to derive the master key.
 * @param addressIndex - The index of the address to derive.
 * @returns A JSON string containing the derived Ethereum address, public key, and private key.
 */
export const createEthAddress = (
    seedHex: string,
    addressIndex: string
): string => {
    const masterKey = ethers.HDNodeWallet.fromSeed(Buffer.from(seedHex, "hex")); // 生成 RootKey / MasterKey

    const derivedWallet = masterKey.derivePath(`m/44'/60'/0'/0/${addressIndex}`);

    const { privateKey, publicKey, address } = {
        privateKey: derivedWallet.privateKey,
        publicKey: derivedWallet.publicKey,
        address: derivedWallet.address,
    };

    return JSON.stringify({
        address,
        publicKey,
        privateKey,
    });
};

/**
 * Imports an Ethereum address from a given private key.
 *
 * @param privateKey - The private key as a hexadecimal string.
 * @returns A JSON string containing the derived Ethereum address and private key.
 *
 * @throws {Error} If the private key is in an invalid format or length.
 */
export function importEthAddress(privateKey: string): string {
    // 移除前缀 "0x"（如果有）
    if (privateKey.startsWith("0x")) {
        privateKey = privateKey.slice(2);
    }

    // 验证私钥格式
    if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
        throw new Error(
            "Invalid private key format. It must be a 64-character hexadecimal string."
        );
    }
    const wallet = new ethers.Wallet(privateKey);

    return JSON.stringify({
        privateKey,
        address: wallet.address,
    });
}

export function publicKeyToAddress(publicKey: string): string {
    // 检查公钥是否以 "0x" 开头
    if (!publicKey.startsWith("0x")) {
        throw new Error('Public key must start with "0x".');
    }
    if (publicKey.length !== 68) {
        throw new Error(
            'Invalid public key length. Expected 68 characters (including "0x").'
        );
    }

    // 使用 ethers.js 计算地址
    return ethers.computeAddress(publicKey);
}

export interface EthSignParams {
    privateKey: string;
    nonce: number;
    from: string;
    to: string;
    gasPrice?: number;
    gasLimit: number;
    amount: string;
    tokenAddress?: string;
    decimal?: number;
    maxPriorityFeePerGas?: number;
    maxFeePerGas?: number;
    chainId: Chain | CustomChain;
    data?: string;
}

export function ethSign(params: EthSignParams): PrefixedHexString {
    const {
        privateKey,
        nonce,
        from,
        to,
        gasPrice,
        gasLimit,
        amount,
        tokenAddress,
        decimal,
        maxPriorityFeePerGas,
        maxFeePerGas,
        chainId,
        data,
    } = params;

    const transactionNonce = numberToHex(nonce);
    const gasLimits = numberToHex(gasLimit);
    let newAmount = BigNumber(amount).times(BigNumber(10).pow(decimal!));
    const numBalanceHex = numberToHex(newAmount);

    let txData: any = {
        nonce: transactionNonce,
        gasLimit: gasLimits,
        to,
        from,
        value: numBalanceHex,
    };
    if (maxFeePerGas && maxPriorityFeePerGas) {
        // EIP-1559
        txData.maxFeePerGas = numberToHex(maxFeePerGas);
        txData.maxPriorityFeePerGas = numberToHex(maxPriorityFeePerGas);
    } else {
        txData.gasPrice = numberToHex(gasPrice!);
    }
    if (tokenAddress && tokenAddress !== "0x00") {
        // ERC20
        const ABI = ["function transfer(address to, uint amount)"];
        const face = new Interface(ABI);
        txData.data = face.encodeFunctionData("transfer", [to, numBalanceHex]);
        txData.to = tokenAddress;
        txData.value = "0x0";
    }
    if (data) {
        txData.data = data;
    }
    let common: Common, tx: any;
    if (txData.maxFeePerGas && txData.maxPriorityFeePerGas) {
        if (Object.values(CustomChain).includes(chainId as CustomChain)) {
            common = Common.custom(chainId as CustomChain, {
                hardfork: Hardfork.London,
            });
        } else {
            common = new Common({ chain: chainId, hardfork: Hardfork.London });
        }
        tx = FeeMarketEIP1559Transaction.fromTxData(txData, { common });
    } else {
        common = new Common({ chain: chainId, hardfork: Hardfork.London });

        tx = LegacyTransaction.fromTxData(txData, { common });
    }
    const privateKeyBuffer = Buffer.from(privateKey, "hex");
    const signedTx = tx.sign(privateKeyBuffer);

    const serializedTx = signedTx.serialize();
    if (!serializedTx) {
        throw new Error("sign is null or undefined");
    }

    return bytesToHex(serializedTx);
}
