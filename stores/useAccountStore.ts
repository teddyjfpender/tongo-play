import isValidPrivateKey from "@/utils/isValidPrivateKey";
import randomHex from "@/utils/randomHex";
import {getStringItem, removeItem, setStringItem} from "@/utils/secureStorage";
import starknetAccountFromPrivateKey from "@/utils/starknetAccountFromPrivateKey";
import {Account as TongoAccount} from "@fatsolutions/tongo-sdk";
import {ProjectivePoint, projectivePointToStarkPoint, pubKeyBase58ToAffine} from "@fatsolutions/tongo-sdk/src/types";
import {deriveStarknetKeyPairs, joinMnemonicWords, mnemonicToWords} from "@starkms/key-management";
import {Account, CallData, RpcError, RpcProvider} from "starknet";
import {create} from "zustand";

const OZ_ACCOUNT_CLASS_HASH = "0x05b4b537eaa2399e3aa99c4e2e0208ebd6c71bc1467938cd52c798c601e43564";
const TONGO_STRK_CONTRACT_ADDRESS = "0x00b4cca30f0f641e01140c1c388f55641f1c3fe5515484e622b6cb91d8cee585";
const OZ_ACCOUNT_MNEMONIC = "oz.account.mnemonic";

export interface AccountState {
    readonly provider: RpcProvider;
    isInitialized: boolean;
    isDeployed: boolean;
    starknetAccount: Account | null;
    tongoAccount: TongoAccount | null;
    tongoBalance: TongoBalance | null;

    initialize: () => Promise<void>;

    // "restore wallet"
    restoreFromMnemonic: (mnemonic: string[], save: boolean) => Promise<void>;

    restoreStarknetAccount: (privateKey: string) => Promise<void>;
    createStarknetAccount: (privateKey?: string) => Promise<void>;
    deployStarknetAccount: () => Promise<void>;

    createTongoAccount: () => Promise<void>;
    associateTongoAccount: (mnemonic: string) => Promise<void>;
    fund: (amount: bigint) => Promise<void>;
    transfer: (amount: bigint, recipientAddress: string) => Promise<void>;
    rollover: () => Promise<void>;
    withdraw: (amount: bigint) => Promise<void>;
    refreshBalance: () => Promise<void>;
    ragequit: () => Promise<void>;
    nuke: () => Promise<void>;
}

export type TongoBalance = {
    tongoBalance: bigint;
    tongoPendingBalance: bigint;
    nonce: bigint;

    erc20Balance: bigint;
    erc20pendingBalance: bigint;
}

async function getAccountClassHash(provider: RpcProvider, account: Account): Promise<string | null> {
    try {
        return await provider.getClassHashAt(account.address);
    } catch (e) {
        // TODO ask how to check for errors properly
        if (e instanceof RpcError && e.code === 20) {
            return null;
        } else {
            console.error(JSON.stringify(e))
            throw e
        }
    }
}

function assertAmountInRange(amount: bigint) {
    // Tongo supports 32-bit integer balances only
    const MAX_32BIT = (1n << 32n) - 1n;
    if (amount < 0n) {
        throw new Error("Amount must be a positive integer");
    }
    if (amount > MAX_32BIT) {
        throw new Error(`Amount too large. Max supported is ${MAX_32BIT}`);
    }
}

export const useAccountStore = create<AccountState>((set, get) => ({
    provider: new RpcProvider({
        nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_9"
    }),
    isInitialized: false,
    isDeployed: false,
    starknetAccount: null,
    tongoAccount: null,
    tongoBalance: null,

    initialize: async () => {
        const {restoreFromMnemonic} = get();
        const mnemonic = await getStringItem(OZ_ACCOUNT_MNEMONIC);

        if (mnemonic) {
            const words = mnemonicToWords(mnemonic);
            await restoreFromMnemonic(words, false)
        } else {
            set({starknetAccount: null, isInitialized: true});
            console.log("No Account from local storage");
        }
    },

    restoreFromMnemonic: async (mnemonic: string[], save: boolean) => {
        const { provider, associateTongoAccount } = get();

        console.log("Restoring account from mnemonic");
        const mnemonicPhrase = joinMnemonicWords(mnemonic)
        await setStringItem(OZ_ACCOUNT_MNEMONIC, mnemonicPhrase);

        // derive regular Starknet key pair for OZ Account Contract
        const args = {accountIndex: 0, addressIndex: 0}
        const accountContractKeyPairs = deriveStarknetKeyPairs(args, mnemonicPhrase, true)

        // store setters
        // starknet account data
        const account = starknetAccountFromPrivateKey(accountContractKeyPairs.spendingKeyPair.privateSpendingKey, OZ_ACCOUNT_CLASS_HASH, provider);

        const classHash = await getAccountClassHash(provider, account);
        const deployed = classHash !== null;
        console.log("Account", account.address);
        set({starknetAccount: account, isDeployed: deployed, isInitialized: true});

        // tongo account data
        if (deployed) {
            await associateTongoAccount(mnemonicPhrase)
        }
    },

    restoreStarknetAccount: async (privateKey: string) => {
        const {provider} = get();

        const key = privateKey.startsWith("0x")
            ? privateKey
            : `0x${privateKey}`;

        if (!isValidPrivateKey(key)) {
            throw new Error("Invalid Private Key");
        }

        const account = starknetAccountFromPrivateKey(key, OZ_ACCOUNT_CLASS_HASH, provider);
        await setStringItem(OZ_ACCOUNT_MNEMONIC, key);

        let classHash = await getAccountClassHash(provider, account);
        set({starknetAccount: account, isDeployed: classHash !== null});
        console.log("Account restored", account.address);
    },
    createStarknetAccount: async (privateKey?: string) => {
        const {provider} = get();
        const privKey: string = privateKey
            ? (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`)
            : `0x0${randomHex(63)}`;

        console.log("Private Key: ", privKey);
        const account = starknetAccountFromPrivateKey(privKey, OZ_ACCOUNT_CLASS_HASH, provider);
        await setStringItem(OZ_ACCOUNT_MNEMONIC, privKey);

        set({starknetAccount: account, isDeployed: false});
        console.log("Account created ", account.address);
    },
    deployStarknetAccount: async () => {
        const {starknetAccount, provider} = get();
        if (!starknetAccount) {
            throw new Error("StarknetAccount not found. Nothing to deploy...");
        }

        const pubKey = await starknetAccount.signer.getPubKey();

        console.log("Deploying...")
        const { transaction_hash } = await starknetAccount.deploySelf({
            classHash: OZ_ACCOUNT_CLASS_HASH,
            constructorCalldata: CallData.compile({ publicKey: pubKey }),
        })
        console.log(`Deploying ${transaction_hash}...`)
        await provider.waitForTransaction(transaction_hash);
        console.log("✅ Account deployed.");
        set({isDeployed: true})
    },

    createTongoAccount: async () => {
        const {associateTongoAccount} = get();
        const mnemonic = await getStringItem(OZ_ACCOUNT_MNEMONIC);

        if (!mnemonic) throw new Error("No mnemonic stored");

        await associateTongoAccount(mnemonic);
    },
    associateTongoAccount: async (mnemonic: string) => {
        const {provider, refreshBalance} = get();

        // Currently constant index
        const argsTongo = {accountIndex: 0, addressIndex: 0, coinType: 5454}
        const tongoKeyPairs = deriveStarknetKeyPairs(argsTongo, mnemonic, false)

        const tongoAccount = new TongoAccount(tongoKeyPairs.spendingKeyPair.privateSpendingKey, TONGO_STRK_CONTRACT_ADDRESS, provider);
        console.log("Tongo Account: ", tongoAccount.tongoAddress());

        set({tongoAccount: tongoAccount});
        await refreshBalance();
    },
    fund: async (amount: bigint) => {
        const {provider, starknetAccount, tongoAccount, refreshBalance} = get();

        if (!starknetAccount) throw new Error("Starknet account not found...");
        if (!tongoAccount) throw new Error("Tongo account not found...");

        assertAmountInRange(amount);

        console.log("Initiate funding for:", amount)
        const fundOp = await tongoAccount.fund({amount});
        await fundOp.populateApprove();
        console.log("Execute tx on starknet...")
        const tx = await starknetAccount.execute([
            fundOp.approve!,
            fundOp.toCalldata(),
        ])

        console.log("Waiting for:", tx.transaction_hash);
        await provider.waitForTransaction(tx.transaction_hash);

        console.log("TX Completed");
        await refreshBalance();
    },

    transfer: async (amount: bigint, recipientAddress: string) => {
        const {provider, starknetAccount, tongoAccount, refreshBalance} = get();

        if (!starknetAccount) throw new Error("Starknet account not found...");
        if (!tongoAccount) throw new Error("Tongo account not found...");

        assertAmountInRange(amount);
        const pubKey = projectivePointToStarkPoint(pubKeyBase58ToAffine(recipientAddress) as ProjectivePoint);
        console.log(`Initiate transfer of ${amount} to ${recipientAddress}`)
        const transferOp = await tongoAccount.transfer({
            to: pubKey,
            amount: amount,
        })

        console.log("Execute tx on starknet...")
        const tx = await starknetAccount.execute(transferOp.toCalldata());
        console.log("Waiting for:", tx.transaction_hash);
        await provider.waitForTransaction(tx.transaction_hash);
        console.log("TX Completed");

        await refreshBalance();
    },
    rollover: async () => {
        const {provider, starknetAccount, tongoAccount, refreshBalance} = get();

        if (!starknetAccount) throw new Error("Starknet account not found...");
        if (!tongoAccount) throw new Error("Tongo account not found...");

        console.log("Rollover started");
        const rolloverOp = await tongoAccount.rollover();
        console.log("Rollover tx...");
        const tx = await starknetAccount.execute(rolloverOp.toCalldata());
        console.log("Rollover tx sent...");
        await provider.waitForTransaction(tx.transaction_hash)
        console.log("Rollover succeeded");

        await refreshBalance();
    },
    withdraw: async (amount: bigint) => {
        const {provider, starknetAccount, tongoAccount, refreshBalance} = get();

        if (!starknetAccount) throw new Error("Starknet account not found...");
        if (!tongoAccount) throw new Error("Tongo account not found...");

        console.log("Withdraw started");
        const withdrawOp = await tongoAccount.withdraw({
            to: starknetAccount.address,
            amount: amount
        });

        console.log("Withdraw tx...");
        const withdrawTx = await starknetAccount.execute(withdrawOp.toCalldata());
        console.log("Withdraw tx sent", withdrawTx.transaction_hash);
        await provider.waitForTransaction(withdrawTx.transaction_hash);
        console.log("Withdraw succeeded");
        await refreshBalance();
    },
    refreshBalance: async () => {
        const {tongoAccount} = get();
        if (!tongoAccount) throw new Error("Tongo account not found...");

        console.log("Refreshing balance...")
        const state = await tongoAccount.state();
        const rate = await tongoAccount.rate();

        console.log("Refreshed")
        set({
            tongoBalance: {
                tongoBalance: state.balance,
                tongoPendingBalance: state.pending,
                nonce: state.nonce,
                erc20Balance: state.balance * rate,
                erc20pendingBalance: state.pending * rate,
            }
        });
    },
    ragequit: async () => {
        const {provider, starknetAccount, tongoAccount, refreshBalance} = get();
        if (!starknetAccount) throw new Error("Starknet account not found...");
        if (!tongoAccount) throw new Error("Tongo account not found...");

        console.log("Rage quitting...")
        const ragequitOp = await tongoAccount.ragequit({
            to: starknetAccount.address
        })

        console.log("Rage quit tx...");
        const ragequitTx = await starknetAccount.execute(ragequitOp.toCalldata())

        console.log("Rage quit sent", ragequitTx.transaction_hash);
        await provider.waitForTransaction(ragequitTx.transaction_hash);
        console.log("Rage quit succeeded");

        await refreshBalance();
    },

    nuke: async () => {
        const {starknetAccount} = get();
        if (!starknetAccount) {
            throw new Error("StarknetAccount not found. Nothing to remove...");
        }

        await removeItem(OZ_ACCOUNT_MNEMONIC);
        set({
            isInitialized: true,
            starknetAccount: null,
            tongoAccount: null,
            tongoBalance: null,
            isDeployed: false
        })
    },
}));
