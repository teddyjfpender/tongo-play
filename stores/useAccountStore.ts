import {create} from "zustand";
import {Account, CallData, ec, RpcError, RpcProvider} from "starknet";
import * as SecureStore from 'expo-secure-store';
import randomHex from "@/utils/randomHex";
import starknetAccountFromPrivateKey from "@/utils/starknetAccountFromPrivateKey";
import isValidPrivateKey from "@/utils/isValidPrivateKey";

const OZ_ACCOUNT_CLASS_HASH = "0x540d7f5ec7ecf317e68d48564934cb99259781b1ee3cedbbc37ec5337f8e688";
const TONGO_CONTRACT_ADDRESS = "0x028798470f0939d26aab8a3dcb144b9045fb113867ae205ad59b1b47ec904f00";
const OZ_ACCOUNT_STORAGE_KEY = "oz.account.key";

export interface AccountState {
    readonly provider: RpcProvider;
    isInitialized: boolean;
    isDeployed: boolean;
    starknetAccount: Account | null;
    // tongoAccount: TongoAccount | null;

    initialize: () => Promise<void>;

    restoreStarknetAccount: (privateKey: string) => Promise<void>;
    createStarknetAccount: () => Promise<void>;
    deployStarknetAccount: () => Promise<void>;

    nuke: () => Promise<void>;
}

async function getAccountClassHash(provider: RpcProvider, account: Account): Promise<string|null> {
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

export const useAccountStore = create<AccountState>((set, get) => ({
    provider: new RpcProvider({
        nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_9"
    }),
    isInitialized: false,
    isDeployed: false,
    starknetAccount: null,
    tongoAccount: null,

    initialize: async () => {
        const { provider } = get();
        const privateKey = await SecureStore.getItemAsync(OZ_ACCOUNT_STORAGE_KEY);

        if (privateKey) {
            const account = starknetAccountFromPrivateKey(privateKey, OZ_ACCOUNT_CLASS_HASH, provider);
            let classHash = await getAccountClassHash(provider, account);

            set({starknetAccount: account, isInitialized: true, isDeployed: classHash !== null});
            console.log("Account from local storage: ", account.address);
        } else {
            set({starknetAccount: null, isInitialized: true});
            console.log("No Account from local storage");
        }
    },

    restoreStarknetAccount: async (privateKey: string) => {
        const { provider } = get();

        const key = privateKey.startsWith("0x")
            ? privateKey
            : `0x${privateKey}`;

        if (!isValidPrivateKey(key)) {
            throw new Error("Invalid Private Key");
        }

        const account = starknetAccountFromPrivateKey(privateKey, OZ_ACCOUNT_CLASS_HASH, provider);
        await SecureStore.setItemAsync(OZ_ACCOUNT_STORAGE_KEY, privateKey);

        let classHash = await getAccountClassHash(provider, account);
        set({starknetAccount: account, isDeployed: classHash !== null});
        console.log("Account restored", account.address);
    },
    createStarknetAccount: async () => {
        const { provider } = get();

        const privateKey = `0x0${randomHex(63)}`

        console.log("Private Key: ", privateKey);
        const account = starknetAccountFromPrivateKey(privateKey, OZ_ACCOUNT_CLASS_HASH, provider);
        await SecureStore.setItemAsync(OZ_ACCOUNT_STORAGE_KEY, privateKey);

        set({starknetAccount: account, isDeployed: false});
        console.log("Account created ", account.address);
    },
    deployStarknetAccount: async () => {
        const { starknetAccount, provider } = get();
        if (!starknetAccount) {
            throw new Error("StarknetAccount not found. Nothing to deploy...");
        }

        const privateKey = await SecureStore.getItemAsync(OZ_ACCOUNT_STORAGE_KEY);
        if (!privateKey) {
            throw new Error("No private key found...");
        }

        const pubKey = ec.starkCurve.getStarkKey(privateKey)
        const constructorCallData = CallData.compile({ publicKey: pubKey });
        console.log("Deploying...")
        const { transaction_hash, contract_address } = await starknetAccount.deployAccount({
            classHash: OZ_ACCOUNT_CLASS_HASH,
            constructorCalldata: constructorCallData,
            addressSalt: pubKey,
        });
        console.log(`Deploying ${transaction_hash}...`)
        const receipt = await provider.waitForTransaction(transaction_hash);
        console.log('✅ Account deployed.\n   address =', contract_address, receipt);
        set({isDeployed: true})
    },

    nuke: async () => {
        const { starknetAccount } = get();
        if (!starknetAccount) {
            throw new Error("StarknetAccount not found. Nothing to remove...");
        }

        await SecureStore.setItemAsync(OZ_ACCOUNT_STORAGE_KEY, "");
        set({
            isInitialized: true,
            starknetAccount: null,
            isDeployed: false
        })
    },
}));