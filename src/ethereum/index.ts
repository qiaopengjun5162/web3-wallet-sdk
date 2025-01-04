import {Interface} from '@ethersproject/abi';
import {LegacyTransaction, FeeMarketEIP1559Transaction} from '@ethereumjs/tx'
import {Common} from '@ethereumjs/common'


const ethers = require('ethers');
const BigNumber = require('bignumber.js');


export function numberToHex(value: number): string {
    const bigNumber = new BigNumber(value);

    // 验证输入
    if (bigNumber.isNaN() || !bigNumber.isFinite()) {
        console.error('Invalid number:', value);
        return '0x0'; // 返回默认值
    }

    // 转换为16进制字符串
    const result = bigNumber.toString(16);
    return result.startsWith('-') ? `-0x${result.slice(1)}` : `0x${result}`;
}

export const createEthAddress = (seedHex: string, addressIndex: string): string => {
    const masterKey = ethers.HDNodeWallet.fromSeed(Buffer.from(seedHex, 'hex')); // 生成 RootKey / MasterKey

    const derivedWallet = masterKey.derivePath(`m/44'/60'/0'/0/${addressIndex}`);

    const {privateKey, publicKey, address} = {
        privateKey: derivedWallet.privateKey,
        publicKey: derivedWallet.publicKey,
        address: derivedWallet.address
    };

    return JSON.stringify({
        address,
        publicKey,
        privateKey
    });
};

export function importEthAddress(privateKey: string): string {
    // 移除前缀 "0x"（如果有）
    if (privateKey.startsWith('0x')) {
        privateKey = privateKey.slice(2);
    }

    // 验证私钥格式
    if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
        throw new Error('Invalid private key format. It must be a 64-character hexadecimal string.');
    }
    const wallet = new ethers.Wallet(privateKey);

    return JSON.stringify({
        privateKey,
        address: wallet.address,
    });

}

export function publicKeyToAddress(publicKey: string): string {
    // 检查公钥是否以 "0x" 开头
    if (!publicKey.startsWith('0x')) {
        throw new Error('Public key must start with "0x".');
    }
    if (publicKey.length !== 68) {
        throw new Error('Invalid public key length. Expected 68 characters (including "0x").');
    }

    // 使用 ethers.js 计算地址
    return ethers.computeAddress(publicKey);
}

export async function signOpMainnetTransaction(params: any): Promise<string> {
    const {privateKey, nonce, from, to, gasLimit, gasPrice, amount, data, chainId, decimal, maxFeePerGas,
        maxPriorityFeePerGas, tokenAddress, tokenId} = params;
    const wallet = new ethers.Wallet(Buffer.from(privateKey, 'hex'));
    const txData: any = {
        nonce: ethers.utils.hexlify(nonce),
        from,
        to,
        gasLimit: ethers.utils.hexlify(gasLimit),
        value: ethers.utils.hexlify(ethers.utils.parseUnits(amount, decimal)),
        chainId
    };
    if (maxFeePerGas && maxPriorityFeePerGas) {
        txData.maxFeePerGas = numberToHex(maxFeePerGas);
        txData.maxPriorityFeePerGas = numberToHex(maxPriorityFeePerGas);
    } else {
        txData.gasPrice = ethers.utils.hexlify(gasPrice);
    }
    if (tokenAddress && tokenAddress !== '0x00') {
        let idata: any;
        if (tokenId == "0x00") {
            const ABI = [
                'function transfer(address to, uint amount)'
            ];
            const iface = new Interface(ABI);
            idata = iface.encodeFunctionData('transfer', [to, ethers.utils.hexlify(ethers.utils.parseUnits(amount, decimal))]);
        } else {
            const abi = [
                "function safeTransferFrom(address from, address to, uint256 tokenId)"
            ];
            const iface = new ethers.utils.Interface(abi);
            idata = iface.encodeFunctionData("safeTransferFrom", [wallet.address, to, tokenId]);
        }
        txData.data = idata;
        txData.to = tokenAddress;
        txData.value = 0;
    }
    if (data) {
        txData.data = data;
    }
    return wallet.signTransaction(txData);
}

export function ethSign(params: any) {
    const {privateKey, nonce, from, to, gasPrice, gasLimit, amount, tokenAddress, decimal, maxPriorityFeePerGas,
        maxFeePerGas, chainId, data} = params;

    const transactionNonce = numberToHex(nonce);
    const gasLimits = numberToHex(gasLimit);
    const chainIdHex = numberToHex(chainId);
    let newAmount = BigNumber(amount).times((BigNumber(10).pow(decimal)));
    const numBalanceHex = numberToHex(newAmount);

    let txData: any = {
        nonce: transactionNonce,
        gasLimit: gasLimits,
        to,
        from,
        chainId: chainIdHex,
        value: numBalanceHex
    }
    if (maxFeePerGas && maxPriorityFeePerGas) {
        txData.maxFeePerGas = numberToHex(maxFeePerGas);
        txData.maxPriorityFeePerGas = numberToHex(maxPriorityFeePerGas);
    } else {
        txData.gasPrice = numberToHex(gasPrice);
    }
    if (tokenAddress && tokenAddress !== "0x00") {
        const ABI = ["function transfer(address to, uint amount)"];
        const iface = new Interface(ABI);
        txData.data = iface.encodeFunctionData("transfer", [to, numBalanceHex]);
        txData.to = tokenAddress;
        txData.value = '0x0';
    }
    if (data) {
        txData.data = data;
    }
    let common: any, tx: any;
    if (txData.maxFeePerGas && txData.maxPriorityFeePerGas) {
        common = Common.custom({
            chainId: parseInt(chainId),
            defaultHardfork: 'london',
        });
        tx = FeeMarketEIP1559Transaction.fromTxData(txData, {common});
    } else {
        common = Common.custom({
            chainId: parseInt(chainId),
        });
        tx = LegacyTransaction.fromTxData(txData, {
            common
        });
    }
    const privateKeyBuffer = Buffer.from(privateKey, "hex");
    // const privateKeyBuffer = Buffer.from(privateKey.replace('0x', ''), 'hex');

    const signedTx = tx.sign(privateKeyBuffer);
    const serializedTx = signedTx.serialize();
    if (!serializedTx) {
        throw new Error("sign is null or undefined");
    }
    return `0x${serializedTx.toString('hex')}`;
}
