// const TonWeb = require('tonweb-lite');
import TonWeb from "tonweb-lite";

import BigNumber from "bignumber.js";

export async function SignTransaction(params: { from: any; to: any; memo: any; amount: any; sequence: any; decimal: any; privateKey: any; }) {
    const { from, to, memo, amount, sequence, decimal, privateKey } = params;
    const tonweb = new TonWeb();
    const calcAmount = new BigNumber(amount).times(new BigNumber(10).pow(decimal)).toNumber();
    if (calcAmount % 1 !== 0) throw new Error("amount invalid");
    const keyPair = TonWeb.utils.nacl.sign.keyPair.fromSecretKey(new Uint8Array(Buffer.from(privateKey, 'hex')));
    const WalletClass = tonweb.wallet.all['v4R2'];
    const wallet = new WalletClass(tonweb.provider, {
        publicKey: keyPair.publicKey,
        wc: 0
    });
    let secretKey = keyPair.secretKey
    const walletAddress = await wallet.getAddress();
    console.log(walletAddress.toString(true, true, false, false))
    const fromAddress = walletAddress.toString(true, true, false, false);
    if (from !== fromAddress) throw new Error("from address invalid");
    const toAddress = new TonWeb.utils.Address(to);
    const tx_ret = await wallet.methods.transfer({
        secretKey,
        toAddress: toAddress.toString(true, true, false, false),
        amount: calcAmount,
        seqno: sequence,
        payload: memo || "",
        sendMode: 3, // 3 默认为转账, 细节请看调研文档
    })
    const queryData = await tx_ret.getQuery()
    const hash = await queryData.hash()
    const boc = await queryData.toBoc(false);
    return {
        "hash": TonWeb.utils.bytesToBase64(hash),
        "rawtx": TonWeb.utils.bytesToBase64(boc)
    }
}
