import { createTonAddress } from '@/ton/address';
import { SignTransaction } from '@/ton/sign';
import * as bip39 from 'bip39';

describe('create wallet', () => {
    test('createTonAddress should return correct address, publicKey, and privateKey', async () => {
        const mnemonic = "champion junior glimpse analyst plug jump entire barrel slight swim hidden remove";
        const seed = bip39.mnemonicToSeedSync(mnemonic, "");
        const seedHex = seed.toString('hex'); // 将种子转换为hex字符串

        // 调用 createTonAddress 函数，获取地址信息
        const addressInfo = await createTonAddress(seedHex, 0);

        // 验证返回的数据是否正确
        expect(addressInfo).toHaveProperty('privateKey');
        expect(addressInfo).toHaveProperty('publicKey');
        expect(addressInfo).toHaveProperty('address');

        // 验证 publicKey 和 privateKey 是有效的 hex 字符串
        expect(addressInfo.privateKey).toMatch(/^[a-f0-9]+$/);
        expect(addressInfo.publicKey).toMatch(/^[a-f0-9]+$/);

        // 验证 address 是否符合 TON 地址格式
        expect(addressInfo.address).toMatch(/^E[A-Za-z0-9]{32}$/); // 示例，具体格式可能依照 TON 地址标准有所不同
    });

    test('sign transaction', async () => {
        const param = {
            from: "UQAUAHcUab66DpOV2GaT_QDuSagpMdIn0x6aMmO3_fPVM305",
            to: "EQCQCLTvR0XYTyM0uxh_H8kLAR7u7v98pEKZKpbq8w2peuNY",
            memo: "memo",
            amount: 0.01,
            sequence: 38103804,
            decimal: 10,
            privateKey: "b0e4eb37bc5929491899d2a50f52f0a4613d3a48e56245267fdecff392ead89b7e4fdf79bf78566b85b73787e5739ab4306350d7ad1adc50be9c57fe2102bfcc"
        }
        const sign_message = await SignTransaction(param)
        console.log("sign_message===", sign_message)
    })
});
