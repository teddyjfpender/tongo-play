import {ActivityIndicator, Pressable, Text, View} from "react-native"
import {useAccountStore} from "@/stores/useAccountStore";
import {Abi, Contract, num, Provider, uint256} from "starknet";
import {useCallback, useEffect, useMemo, useState} from "react";
import {IconSymbol} from "@/components/ui/icon-symbol";

export interface TokenBalanceProps {
    token: string,
    erc20Address: string;
    accountAddress: string;
}

const TokenBalance = ({token, erc20Address, accountAddress}: TokenBalanceProps) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [balance, setBalance] = useState("");
    const {provider} = useAccountStore();
    const observer = useMemo(() => {
        return new BalanceChecker(erc20Address, accountAddress, provider);
    }, [provider, erc20Address, accountAddress]);

    const refreshBalance = useCallback(async () => {
        setIsRefreshing(true);
        const balance = await observer.check();
        setBalance(balance);
        setIsRefreshing(false);
    }, [setIsRefreshing, observer, setBalance]);

    useEffect(() => {
        void refreshBalance();
    }, [refreshBalance]);

    return (
        <View style={{
            flexDirection: "row",
            marginHorizontal: 8,
            padding: 8,
            borderWidth: 1,
            justifyContent: "space-between"
        }}>
            <View style={{flexDirection: "row", gap: 16}}>
                <Text>Balance:</Text>
                <Text>{`${balance} ${token}` }</Text>
            </View>

            <View>
                {isRefreshing ? (
                    <ActivityIndicator
                        size={16}
                        color={"black"}
                    />
                ) : (
                    <Pressable onPress={() => {
                        void refreshBalance();
                    }}>
                        <IconSymbol name={"arrow.clockwise"} size={16} color={"black"} />
                    </Pressable>
                )}
            </View>
        </View>
    );
}

export default TokenBalance;

class BalanceChecker {
    private abi: Abi;
    private tokenAddress: string;
    private accountAddress: string;
    private provider: Provider;

    constructor(
        tokenAddress: string,
        accountAddress: string,
        provider: Provider
    ) {
        this.tokenAddress = tokenAddress;
        this.accountAddress = accountAddress;
        this.provider = provider;

        this.abi = ERC20_BALANCE_ABI;
    }

    public async check(): Promise<string> {
        const erc20Contract = new Contract({
            abi: this.abi,
            address: this.tokenAddress,
            providerOrAccount: this.provider
        });

        const result = await erc20Contract.balanceOf(this.accountAddress);

        const { low, high } = result.balance;
        const balanceBigInt = uint256.uint256ToBN({ low, high });
        console.log(balanceBigInt);
        return balanceBigInt.toLocaleString("en-US", {})
    }
}

const ERC20_BALANCE_ABI = [
    {
        "type": "function",
        "name": "balanceOf",
        "inputs": [
            { "name": "account", "type": "felt" }
        ],
        "outputs": [
            { "name": "balance", "type": "Uint256" }
        ],
        "stateMutability": "view"
    },
    {
        "type": "struct",
        "name": "Uint256",
        "members": [
            { "name": "low", "type": "felt" },
            { "name": "high", "type": "felt" }
        ]
    }
]