import bs58 from "bs58";
import * as bip39 from 'bip39';
import {createAccount, deactivateStake, delegateStake, withdrawFunds} from "@/solana/staking";
import {derivePath, getPublicKey} from "ed25519-hd-key";

describe('CreateStakeAccount', () => {
        test('public key to address', async () => {
            const pubKey = "3a7b3874ba467be6b81ea361e3d7453af8b81c88aedd24b5031fdda0bc71ad32"
            const buffer = Buffer.from(pubKey, "hex");
            console.log(bs58.encode(buffer)) // 4wHd9tf4x4FkQ3JtgsMKyiEofEHSaZH5rYzfFKLvtESD
        });

        test('create stake account', async () => {
            const params = {
                authorPrivateKey: "55a70321542da0b6123f37180e61993d5769f0a5d727f9c817151c1270c290963a7b3874ba467be6b81ea361e3d7453af8b81c88aedd24b5031fdda0bc71ad32",
                stakeAccountPrivateKey: "ae7aebb8767bb0117f2034c6f13a971a8327676092b30d87cd069620deaa133a0eb55ff73c71d436f86e2388ff8ebc55e77a1a5ffa6e4a5c56cdb3517f25c0e0",
                lamportsForStakeAccount: 19947680,
                recentBlockhash: "EusW5Ltz8HsaG4nqaWA7aMo6cq5hJpf7z9eGcTeYifQS",
                votePubkeyStr: "7PmWxxiTneGteGxEYvzj5pGDVMQ4nuN9DfUypEXmaA8o"
            }
            const txSignHex = await createAccount(params)
            console.log("txSignHex==", txSignHex)
            // txSignHex== AgejVlO59bQmxZ08VkNe0W0vShqBrRxXiL4zIR5PG7gD1EzgQ4B7dUD5JjIEVpdwQlbL/yX8dSezp+e0RTJmEQcLb79SRu4ou5wXbDVe7TKtXjUUKIBM6jcjfdRAPyhbpTBrhNRy749UUNfOHBK11xo0YuUzrE3yjEF+iVxS/HQNAgAHCTp7OHS6RnvmuB6jYePXRTr4uByIrt0ktQMf3aC8ca0yDrVf9zxx1Db4biOI/468Ved6Gl/6bkpcVs2zUX8lwOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF77PAa5Gc+iXQ0DNOT2Wg/WL9TtHwDYLvKjtIPRIWtwBqHYF5E3VCqYNDe9/ip6slV/U1yKeHIraKSdwAAAAAAGodgXpQIFC2gHkebObbiOHltxUPYfxnkKTrTRAAAAAAan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAABqfVFxksXFEhjMlMPUrxf1ja7gibof1E49vZigAAAAAGp9UXGTWE0P7tm7NDHRMga+VEKBtXuFZsxTdf9AAAAM6zO+5j9OHxCCAzs2GKulTRLOodUZ9TQbK7GzQZWWkfAwICAAE0AAAAAKBgMAEAAAAAyAAAAAAAAAAGodgXkTdUKpg0N73+KnqyVX9TXIp4citopJ3AAAAAAAQCAQd0AAAAADp7OHS6RnvmuB6jYePXRTr4uByIrt0ktQMf3aC8ca0yOns4dLpGe+a4HqNh49dFOvi4HIiu3SS1Ax/doLxxrTIAAAAAAAAAAAAAAAAAAAAAOns4dLpGe+a4HqNh49dFOvi4HIiu3SS1Ax/doLxxrTIEBgEDBggFAAQCAAAA
        });

        test('delegate stake', async () => {
            const params = {
                authorPrivateKey: "55a70321542da0b6123f37180e61993d5769f0a5d727f9c817151c1270c290963a7b3874ba467be6b81ea361e3d7453af8b81c88aedd24b5031fdda0bc71ad32",
                stakeAccountPrivateKey: "cf5b9e12e56fdf6bcf6b408f169be215f9e2d0f0cd5590285eaede2c6edb3aa066a342b49147765b89df0d6234580323f989cca3cce7af8178b33795c7ef5d72",
                recentBlockhash: "3uPa3SjN9SRjbsJT9HVN7q6cKoQr27e8rHrh1c8qwAca",
                votePubkeyStr: "7PmWxxiTneGteGxEYvzj5pGDVMQ4nuN9DfUypEXmaA8o"
            }
            const txSignHex = await delegateStake(params)
            console.log("txSignHex==", txSignHex)
            // txSignHex== Ar5dnhv7plGZFqv8FgCApJr9f+Dj895qEJQ62taSuFg7Z5YSRbgSXyb/NoGLbafBEdar/nn5Fk5HGmdAGqZJzwbjU8uTwW4LRHEucKdSggCXDwbqa1ms9niiH9+wbuP2EAlBxf6y2VmjphtMH+HPOCMt4oTwL8zWRGBDutrnzc0EAgAFBzp7OHS6RnvmuB6jYePXRTr4uByIrt0ktQMf3aC8ca0yZqNCtJFHdluJ3w1iNFgDI/mJzKPM56+BeLM3lcfvXXJe+zwGuRnPol0NAzTk9loP1i/U7R8A2C7yo7SD0SFrcAah2BeRN1QqmDQ3vf4qerJVf1NcinhyK2ikncAAAAAABqHYF6UCBQtoB5Hmzm24jh5bcVD2H8Z5Ck600QAAAAAGp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAAan1RcZNYTQ/u2bs0MdEyBr5UQoG1e4VmzFN1/0AAAAKyMYdmYVlTV52gZTt7ZY6Se1qLRvrn5TRd4QyyMhYeMBAwYBAgUGBAAEAgAAAA==
        });

        test('deactivate stake', async () => {
            const params = {
                authorPrivateKey: "55a70321542da0b6123f37180e61993d5769f0a5d727f9c817151c1270c290963a7b3874ba467be6b81ea361e3d7453af8b81c88aedd24b5031fdda0bc71ad32",
                stakeAccountPrivateKey: "0644b2bed9fb8ddd88268c13d36c9e876fe72422f7ffa032cca62b4865785eb5d31074de1724720bc15860b7753b514bee38510630a908b68f59d10f0f7ea7e0",
                recentBlockhash: "C4L6FyFLeH1tryUtLcSNNi8WUyRVUfKyhrQGBxS8i7RA",
            }
            const txSignHex = await deactivateStake(params)
            console.log("txSignHex==", txSignHex)
            // txSignHex== Ak1c4NK9apY5OBLMpuoM+lweWopzAXt1XAKROX2Ab8gOdBWV4DbV5HEARfRlLNH182YGSJjvhjvtVnh0hFIP7gv3oc9GIdkdAGM/soHjyR18SkqMGkJc1WjcyiAMwQTA6f3CJrtvuYqiuTln4EAPsLM+oO6zRMDmjbv8fwkSmM8AAgACBDp7OHS6RnvmuB6jYePXRTr4uByIrt0ktQMf3aC8ca0y0xB03hckcgvBWGC3dTtRS+44UQYwqQi2j1nRDw9+p+AGodgXkTdUKpg0N73+KnqyVX9TXIp4citopJ3AAAAAAAan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAApEribguzenPnzTD6f+MJ+2/HLsyIqTTH6lSCCwSpBokBAgMBAwAEBQAAAA==
        });

        test('withdraw funds', async () => {
            const params = {
                authorPrivateKey: "55a70321542da0b6123f37180e61993d5769f0a5d727f9c817151c1270c290963a7b3874ba467be6b81ea361e3d7453af8b81c88aedd24b5031fdda0bc71ad32",
                stakeAccountPrivateKey: "0644b2bed9fb8ddd88268c13d36c9e876fe72422f7ffa032cca62b4865785eb5d31074de1724720bc15860b7753b514bee38510630a908b68f59d10f0f7ea7e0",
                recentBlockhash: "5Sqn7oLnVRkkdFV2Dy1hiR1HnUJusuvBQ8NFP4yXJH8j",
                stakeBalance: 1010592,
            }
            const txSignHex = await withdrawFunds(params)
            console.log("txSignHex==", txSignHex)
            // txSignHex== AkIu892Gf81tuNeEssGc3qf9jf1rnyWpZU5fXxAdlIdjY695D8UM5lxQE69rEFo2YNy7AlbdTFxzD1cw28+v5wBmzbAUrKYWoxAMm76EMtuWb+U9am1Y38UXocM9QYSNNrpPZVXsAYIPsZq9pnna9mqMzJDee5qFHykH1XwjazoIAgADBTp7OHS6RnvmuB6jYePXRTr4uByIrt0ktQMf3aC8ca0y0xB03hckcgvBWGC3dTtRS+44UQYwqQi2j1nRDw9+p+AGodgXkTdUKpg0N73+KnqyVX9TXIp4citopJ3AAAAAAAan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAABqfVFxk1hND+7ZuzQx0TIGvlRCgbV7hWbMU3X/QAAABCDWvXvGB/Dz7J8wuf9dZpjXIAnDuAGjFfVBYDcQoxSAECBQEAAwQADAQAAACgaw8AAAAAAA==
            // txSignHex== AkIu892Gf81tuNeEssGc3qf9jf1rnyWpZU5fXxAdlIdjY695D8UM5lxQE69rEFo2YNy7AlbdTFxzD1cw28+v5wBmzbAUrKYWoxAMm76EMtuWb+U9am1Y38UXocM9QYSNNrpPZVXsAYIPsZq9pnna9mqMzJDee5qFHykH1XwjazoIAgADBTp7OHS6RnvmuB6jYePXRTr4uByIrt0ktQMf3aC8ca0y0xB03hckcgvBWGC3dTtRS+44UQYwqQi2j1nRDw9+p+AGodgXkTdUKpg0N73+KnqyVX9TXIp4citopJ3AAAAAAAan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAABqfVFxk1hND+7ZuzQx0TIGvlRCgbV7hWbMU3X/QAAABCDWvXvGB/Dz7J8wuf9dZpjXIAnDuAGjFfVBYDcQoxSAECBQEAAwQADAQAAACgaw8AAAAAAA==
        });

        test('create Hd wallet', async () => {
            // const word = "entry wear credit height moment wine assist night despair actual age retreat"
            const generatedMnemonic = "duty asthma steel velvet fold misery source unit canoe verify enjoy cinnamon";
            const seed = bip39.mnemonicToSeedSync(generatedMnemonic);
            console.log("seed==", seed.toString("hex"))
            const {key} = derivePath("m/44'/501'/1'/0'", seed.toString("hex"));
            console.log(getPublicKey(key).toString("hex"))
            const buffer = Buffer.from(getPublicKey(key).toString("hex"), "hex");
            const address = bs58.encode(buffer)
            console.log("address==", address)
        });
    }
)
