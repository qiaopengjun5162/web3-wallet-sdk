import { derivePath, getPublicKey } from 'ed25519-hd-key';
import TonWeb from "tonweb-lite";

// 使用类型断言解决类型定义不匹配的问题
type TonToString = (
    isUserFriendly?: boolean,
    isUrlSafe?: boolean,
    isBounceable?: boolean,
    isTestOnly?: boolean
) => string;

export async function createTonAddress(seedHex: string, addressIndex: number) {
    // 派生路径并获取密钥
    const { key } = derivePath("m/44'/607'/1'/" + addressIndex + "'", seedHex);
    const publicKey = getPublicKey(key, false).toString("hex");
    // const publicKey = getPublicKey(new Uint8Array(key), false).toString('hex');

    // 初始化 TonWeb
    // const tonweb = new TonWeb();
    const tonweb = new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC'));

    const WalletClass = tonweb.wallet.all['v3R2'];

    // 创建钱包实例
    const publicKeyArray = new Uint8Array(Buffer.from(publicKey, "hex"));
    const wallet = new WalletClass(tonweb.provider, {
        publicKey: publicKeyArray,
        wc: 0
    });

    // 日志记录钱包对象
    console.log("wallet", wallet);

    // 确保钱包已初始化
    if (!wallet) {
        throw new Error("Wallet not initialized properly.");
    }

    // 可能需要等待钱包加载和初始化
    try {
        const walletAddress = await wallet.getAddress(); // 获取钱包地址
        console.log("walletAddress", walletAddress);

        if (!walletAddress) {
            throw new Error("Invalid wallet address.");
        }



        const addressString = (walletAddress.toString as TonToString)(true, true, true, false);

        return {
            "privateKey": key.toString('hex') + publicKey,
            "publicKey": publicKey,
            "address": addressString // 返回钱包地址
        };
    } catch (error) {
        console.error("Error getting wallet address:", error);
        throw error;
    }
}

export function verifyAddress(params: any) {
    const { address } = params;
    const regex = new RegExp("^[a-zA-Z0-9\+\-\_\*\/\%\=]{48}$");
    if (!regex.test(address)) return false;
    const dAddress = new TonWeb.utils.Address(address);
    const nfAddr = dAddress.toString(false);
    const fnsnbntAddr = dAddress.toString(true, false, false, false);
    const fsnbntAddr = dAddress.toString(true, true, false, false);
    const fnsnbtAddr = dAddress.toString(true, false, false, true);
    const fsnbtAddr = dAddress.toString(true, true, false, true);
    const fnsbntAddr = dAddress.toString(true, false, true, false);
    const fsbntAddr = dAddress.toString(true, true, true, false);
    const fnsbtAddr = dAddress.toString(true, false, true, true);
    const fsbtAddr = dAddress.toString(true, true, true, true);
    return address === nfAddr || address === fnsnbntAddr
        || address === fsnbntAddr || address === fnsnbtAddr
        || address === fsnbtAddr || address === fnsbntAddr || address === fsbntAddr
        || address === fnsbtAddr || address === fsbtAddr;
}


export function importTonAddress(privateKey: string) {
    const keyPair = TonWeb.utils.nacl.sign.keyPair.fromSecretKey(new Uint8Array(Buffer.from(privateKey, 'hex')));

    const tonweb = new TonWeb();

    const WalletClass = tonweb.wallet.all['v3R2'];

    const wallet = new WalletClass(tonweb.provider, {
        publicKey: keyPair.publicKey,
        wc: 0
    });

    const walletAddress = wallet.getAddress();
    const addressString = (walletAddress.toString as TonToString)(true, true, true, false);
    return {
        "privateKey": privateKey,
        "publicKey": Buffer.from(keyPair.publicKey).toString("hex"),
        "address": addressString
    }
}
