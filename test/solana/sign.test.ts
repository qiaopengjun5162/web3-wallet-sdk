import { createSolAddress, prepareAccount, signSolTransaction, verifySolAddress } from '@/solana/sign';
import { Connection, NonceAccount } from '@solana/web3.js';
// import { NonceAccount } from "@solana/web3.js";
import * as bip39 from 'bip39';
import bs58 from 'bs58';


describe('CreateStakeAccount', () => {
    test('public key to address', async () => {
        const pubKey = "3a7b3874ba467be6b81ea361e3d7453af8b81c88aedd24b5031fdda0bc71ad32"
        const buffer = Buffer.from(pubKey, "hex");
        console.log(bs58.encode(buffer)) // 4wHd9tf4x4FkQ3JtgsMKyiEofEHSaZH5rYzfFKLvtESD
    });

    test('decode address', async () => {
        const address = "4wHd9tf4x4FkQ3JtgsMKyiEofEHSaZH5rYzfFKLvtESD"
        const bytes = bs58.decode(address)
        console.log(Buffer.from(bytes).toString('hex'))
        // 3a7b3874ba467be6b81ea361e3d7453af8b81c88aedd24b5031fdda0bc71ad32
    });

    test('create Sol Hd Address', async () => {
        const generatedMnemonic = "face defy torch paper dial goddess floor wage nephew floor million belt";
        const seed = bip39.mnemonicToSeedSync(generatedMnemonic);
        console.log("seed==", seed.toString("hex"))
        const accountInfo = createSolAddress(seed.toString("hex"), "0");
        console.log("accountInfo==", accountInfo)
        // accountInfo== {
        // "address":"4wHd9tf4x4FkQ3JtgsMKyiEofEHSaZH5rYzfFKLvtESD",
        // "publicKey":"3a7b3874ba467be6b81ea361e3d7453af8b81c88aedd24b5031fdda0bc71ad32",
        // "privateKey":"55a70321542da0b6123f37180e61993d5769f0a5d727f9c817151c1270c29096"
        // }
    });

    test('prepareAccount', async () => {
        const params = {
            authorAddress: "4wHd9tf4x4FkQ3JtgsMKyiEofEHSaZH5rYzfFKLvtESD",
            from: "4wHd9tf4x4FkQ3JtgsMKyiEofEHSaZH5rYzfFKLvtESD",
            recentBlockhash: "CSL1MJGUcDbgUEHh6fPsxum42vkhnQCh62whKjEiGwR3",
            minBalanceForRentExemption: 1647680,
            privs: [
                {
                    address: "4wHd9tf4x4FkQ3JtgsMKyiEofEHSaZH5rYzfFKLvtESD",
                    key: "55a70321542da0b6123f37180e61993d5769f0a5d727f9c817151c1270c290963a7b3874ba467be6b81ea361e3d7453af8b81c88aedd24b5031fdda0bc71ad32"
                },
                {
                    address: "4wHd9tf4x4FkQ3JtgsMKyiEofEHSaZH5rYzfFKLvtESD",
                    key: "55a70321542da0b6123f37180e61993d5769f0a5d727f9c817151c1270c290963a7b3874ba467be6b81ea361e3d7453af8b81c88aedd24b5031fdda0bc71ad32"
                }
            ]
        }
        let tx_msg = await prepareAccount(params)
        console.log("tx_msg===", tx_msg)
    });

    test('SignTransaction', async ()=>{
        const authPrivateKey = 'f464f9d6f87e3feece82bcf7509a99adbf9c3f38c8fb30c77ae6a92360a45f656488e3d824c6eb210b97f7f5c49d2e5f0ff63b289f2b2f861af31fa09421163d'
        const fromPrivateKey = '147908be03cee4057ba306da2ea1c3afd26a79f6da5390ab41ebddcda350c7a2bf8047b999003ac1a26acc858d5ee4da64621099a558919e4e330c01ca291da7'
        let from  = "DtYKfuXgffgU21TfDcPWw3XYZwqv1TiDSkosePBwG5YS";
        let to = "9Q3wq576tNcYu1Z4sMG8Ea2KNUtUfQ2WCAzcATBqVD16"
        let nonceAccountAddress = "FaP4Ti84eCuGibYNeGMTKCZW9YyyZHgoSB6nFViGtBdy"
        let authorAddress = "7mSqVJpb8ziMDB7yDAEajeANyDosh1WK5ksS6mCdDHRE"
        let mintAddress = "6bkSpihx773QNWEz7mpvtv8A5d2qNu4sZVGP1ghMuJm3";
        const params =  {
            txObj: {
                from: from,
                amount: "1",
                to: to,
                nonce: "EzktKfV35J6ogsfwQhDftTZxxTDLnJ5vctgFnWhvisup",
                nonceAccountAddress: nonceAccountAddress,
                authorAddress: authorAddress,
                decimal: 0,
                mintAddress: mintAddress,
                txType: "TRANSFER_TOKEN",
                hasCreatedTokenAddr: false
            },
            privs: [
                {address: from, key: fromPrivateKey},
                {address: authorAddress, key: authPrivateKey}
            ]
        }
        let tx_msg = await signSolTransaction(params)
        console.log("tx_msg===", tx_msg)
    });

    // test('decode nonce', async () => {
    //     const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    //     connection.getNonce()
    //     const base58Data = "df8aQUMTjFpKK2cwmaeJaGzBFKgXYcjdLvS1nZDrZH3BQvsUvQLLW9LpE5JUgUy66FYCWhWihfdow5WQvspUmrT38TM6HmznsG9TfNgLc79H"
    //     const aa = NonceAccount.fromAccountData(Buffer.from(base58Data))
    //     // const decodeData = bs58.decode(base58Data)
    //     console.log(aa.nonce)
    // });

    // test success
    test('verifyAddress', async () => {
        const params = {
            address: "9HttLy5NXkH1fnLr3aJywNRVVXS29qKuP5BQRui6VKTY",
        }
        let tx_msg = verifySolAddress(params)
        console.log("tx_msg===", tx_msg)
    });
})
