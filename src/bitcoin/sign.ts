import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
const bip32 = BIP32Factory(ecc);
// https://www.npmjs.com/package/bip32

import * as bitcoin from 'bitcoinjs-lib';
import * as bitcore from 'bitcore-lib';

interface Input {
    address: string;
    txid: string;
    vout: number;
    amount: number;
}

export function buildAndSignTx(params: { privateKey: string; signObj: any; network: string; }): string {
    const { privateKey, signObj, network } = params;
    // Check for required parameters
    if (!privateKey || !signObj || !signObj.inputs || !signObj.outputs || !network) {
        throw new Error('Missing required parameters');
    }

    // Check if the network is valid
    const net = bitcore.Networks.get(network, network);
    if (!net) {
        throw new Error(`Invalid network: ${network}`);
    }

    // Map inputs to the expected format
    const inputs = signObj.inputs.map((input: Input) => {
        if (!input.address || !input.txid || typeof input.vout === 'undefined' || typeof input.amount === 'undefined') {
            throw new Error('Invalid input data');
        }
        return {
            address: input.address,
            txId: input.txid,
            outputIndex: input.vout,
            script: new bitcore.Script.fromAddress(input.address).toHex(),
            satoshis: input.amount
        };
    });


    // Map outputs to the expected format
    const outputs = signObj.outputs.map(output => {
        if (!output.address || typeof output.amount === 'undefined') {
            throw new Error('Invalid output data');
        }
        return {
            address: output.address,
            satoshis: output.amount
        };
    });

    // Create the transaction and sign it
    const transaction = new bitcore.Transaction(net)
        .from(inputs)
        .to(outputs);


    // Set transaction version and sign it
    transaction.version = 2;
    transaction.sign(privateKey);

    return transaction.toString();
}

// https://github.com/bitcoinjs/bitcoinjs-lib/issues/1620
export function buildUnSignTxAndSign(params: { keyPair: any; signObj: any; network: any; }) {
    const { keyPair, signObj, network } = params;
    const psbt = new bitcoin.Psbt({ network });
    const inputs = signObj.inputs.map((input: { address: string | bitcore.Address; txid: any; vout: any; amount: any; }) => {
        return {
            address: input.address,
            txId: input.txid,
            outputIndex: input.vout,
            // eslint-disable-next-line new-cap
            script: new bitcore.Script.fromAddress(input.address).toHex(),
            satoshis: input.amount
        };
    });
    psbt.addInput(inputs);

    const outputs = signObj.outputs.map(output => {
        return {
            address: output.address,
            satoshis: output.amount
        };
    });
    psbt.addOutput(outputs);
    psbt.toBase64();

    psbt.signInput(0, keyPair);
    psbt.finalizeAllInputs();

    const signedTransaction = psbt.extractTransaction().toHex();
    console.log('signedTransaction==', signedTransaction);
}
