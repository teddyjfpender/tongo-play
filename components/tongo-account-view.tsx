import {Account, AccountState} from "@fatsolutions/tongo-sdk";
import {StyleProp, StyleSheet, Text, View, ViewStyle} from "react-native";
import {AddressView} from "@/components/address-view";
import BalanceInput from "@/components/balance-input";
import numberToBigInt from "@/utils/numberToBigInt";

export type AccountStateViewProps = {
    style?: StyleProp<ViewStyle>,
    tokenName: string,
    account: Account,
    state: AccountState;
    onFund: (amount: bigint) => void;
}

function TongoAccountView({style, tokenName, account, state, onFund}: AccountStateViewProps) {
    return (
        <View style={style}>
            <Text style={styles.title}>{`Tongo Account (${tokenName})`}</Text>
            <AddressView address={account.tongoAddress()} />

            <BalanceView label={"Balance"} balance={state.balance} />
            <BalanceView label={"Pending"} balance={state.balance} />
            <BalanceView label={"Nonce"} balance={state.nonce} />

            <BalanceInput
                tokenName={tokenName}
                action={"Fund"}
                placeholder={`Type ${tokenName} amount...`}
                onAction={(balance) => {
                    // Tongo balances are integer (32-bit). Do not scale by 1e18.
                    const amount = numberToBigInt(balance, 0);
                    onFund(amount)
                }} />
        </View>
    );
}

function BalanceView({label, balance}: {label: string, balance: bigint}) {
    return (
        <View style={balanceViewStyles.container}>
            <Text style={balanceViewStyles.label}>{label}</Text>
            <Text style={balanceViewStyles.balance}>{balance}</Text>
        </View>
    )
}

export default TongoAccountView;

const styles = StyleSheet.create({
    title: {
        fontWeight: "bold",
        fontSize: 24,
    }
})

const balanceViewStyles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: 8
    },
    label: {
        fontWeight: "bold",
    },
    balance: {
        fontWeight: "light"
    }
})
