import deriveTongoPrivateKey from "@/utils/deriveTongoPrivateKey";
import isValidPrivateKey from "@/utils/isValidPrivateKey";
import randomHex from "@/utils/randomHex";
import { getStringItem, removeItem, setStringItem } from "@/utils/secureStorage";
import starknetAccountFromPrivateKey from "@/utils/starknetAccountFromPrivateKey";
import { Account as TongoAccount, AccountState as TongoAccountState } from "@fatsolutions/tongo-sdk";
import { Account, CallData, ec, RpcError, RpcProvider } from "starknet";
import { create } from "zustand";
import {ProjectivePoint, projectivePointToStarkPoint, pubKeyBase58ToAffine} from "@fatsolutions/tongo-sdk/src/types";

const OZ_ACCOUNT_CLASS_HASH = "0x540d7f5ec7ecf317e68d48564934cb99259781b1ee3cedbbc37ec5337f8e688";
const TONGO_STRK_CONTRACT_ADDRESS = "0x00b4cca30f0f641e01140c1c388f55641f1c3fe5515484e622b6cb91d8cee585";
const OZ_ACCOUNT_STORAGE_KEY = "oz.account.key";

export interface AccountState {
    readonly provider: RpcProvider;
    isInitialized: boolean;
    isDeployed: boolean;
    starknetAccount: Account | null;
    tongoAccount: TongoAccount | null;
    tongoAccountState: TongoAccountState | null;

    initialize: () => Promise<void>;

    restoreStarknetAccount: (privateKey: string) => Promise<void>;
    createStarknetAccount: () => Promise<void>;
    deployStarknetAccount: () => Promise<void>;

    associateTongoAccount: () => Promise<void>;
    fund: (amount: bigint) => Promise<void>;
    transfer: (amount: bigint, recipientAddress: string) => Promise<void>;
    rollover: () => Promise<void>;
    refreshBalance: () => Promise<void>;
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
    tongoAccountState: null,

    initialize: async () => {
        const { provider, associateTongoAccount } = get();
        const privateKey = await getStringItem(OZ_ACCOUNT_STORAGE_KEY);

        if (privateKey) {
            const account = starknetAccountFromPrivateKey(privateKey, OZ_ACCOUNT_CLASS_HASH, provider);
            let classHash = await getAccountClassHash(provider, account);
            let deployed = classHash !== null;
            set({starknetAccount: account, isInitialized: true, isDeployed: deployed});

            if (deployed) {
                await associateTongoAccount();
            }
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
        await setStringItem(OZ_ACCOUNT_STORAGE_KEY, privateKey);

        let classHash = await getAccountClassHash(provider, account);
        set({starknetAccount: account, isDeployed: classHash !== null});
        console.log("Account restored", account.address);
    },
    createStarknetAccount: async () => {
        const { provider } = get();

        const privateKey = `0x0${randomHex(63)}`

        console.log("Private Key: ", privateKey);
        const account = starknetAccountFromPrivateKey(privateKey, OZ_ACCOUNT_CLASS_HASH, provider);
        await setStringItem(OZ_ACCOUNT_STORAGE_KEY, privateKey);

        set({starknetAccount: account, isDeployed: false});
        console.log("Account created ", account.address);
    },
    deployStarknetAccount: async () => {
        const { starknetAccount, provider } = get();
        if (!starknetAccount) {
            throw new Error("StarknetAccount not found. Nothing to deploy...");
        }

        const privateKey = await getStringItem(OZ_ACCOUNT_STORAGE_KEY);
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

    associateTongoAccount: async () => {
        const { provider, starknetAccount } = get();

        if (!starknetAccount) throw new Error("Starknet Account not found...");

        const tongoPrivateKey = await deriveTongoPrivateKey(starknetAccount);
        console.log("Tongo Private Key: ", tongoPrivateKey);
        const tongoAccount = new TongoAccount(tongoPrivateKey, TONGO_STRK_CONTRACT_ADDRESS, provider);
        console.log("Tongo Account: ", tongoAccount.tongoAddress());

        const balance = await tongoAccount.state();
        set({tongoAccount: tongoAccount, tongoAccountState: balance});
    },
    fund: async (amount: bigint) => {
        const { provider, starknetAccount, tongoAccount } = get();

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
        const state = await tongoAccount.state();
        set({tongoAccountState: state});
    },

    transfer: async (amount: bigint, recipientAddress: string) => {
        const { provider, starknetAccount, tongoAccount } = get();

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
        const state = await tongoAccount.state();
        set({tongoAccountState: state});
    },
    rollover: async () => {
        const { provider, starknetAccount, tongoAccount } = get();

        if (!starknetAccount) throw new Error("Starknet account not found...");
        if (!tongoAccount) throw new Error("Tongo account not found...");

        console.log("Rollover started");
        const rolloverOp = await tongoAccount.rollover();
        console.log("Rollover tx...");
        const tx = await starknetAccount.execute(rolloverOp.toCalldata());
        console.log("Rollover tx sent...");
        await provider.waitForTransaction(tx.transaction_hash)
        console.log("Rollover succeeded");
        const state = await tongoAccount.state();
        set({tongoAccountState: state});
    },
    refreshBalance: async () => {
        const { tongoAccount } = get();
        if (!tongoAccount) throw new Error("Tongo account not found...");

        console.log("Refreshing balance...")
        const state = await tongoAccount.state();
        console.log("Refreshed")
        set({tongoAccountState: state});
    },

    nuke: async () => {
        const { starknetAccount } = get();
        if (!starknetAccount) {
            throw new Error("StarknetAccount not found. Nothing to remove...");
        }

        await removeItem(OZ_ACCOUNT_STORAGE_KEY);
        set({
            isInitialized: true,
            starknetAccount: null,
            isDeployed: false
        })
    },
}));
