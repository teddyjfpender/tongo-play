import {Account, AccountState} from "@fatsolutions/tongo-sdk";
import {Button, Pressable, StyleProp, StyleSheet, Text, TextInput, View, ViewStyle} from "react-native";
import {AddressView} from "@/components/address-view";
import BalanceInput from "@/components/balance-input";
import numberToBigInt from "@/utils/numberToBigInt";
import TongoAddressInput from "@/components/tongo-address-input";
import {useEffect, useState} from "react";
import {pubKeyBase58ToAffine} from "@fatsolutions/tongo-sdk/src/types";
import {IconSymbol} from "@/components/ui/icon-symbol";

export type AccountStateViewProps = {
    style?: StyleProp<ViewStyle>,
    tokenName: string,
    account: Account,
    state: AccountState;
    onRefreshBalance: () => void;
    onFund: (amount: bigint) => void;
    onTransfer: (amount: bigint, address: string) => void;
}

function TongoAccountView({
                              style,
                              tokenName,
                              account,
                              state,
                              onRefreshBalance,
                              onFund,
                              onTransfer
                          }: AccountStateViewProps) {
    const [recipient, setRecipient] = useState<string | null>(null);

    useEffect(() => {
        if (recipient) {
            const pk =  pubKeyBase58ToAffine(recipient);
            console.log("PK", pk);
        }
    }, [recipient]);

    return (
        <View style={[style, {gap: 8}]}>
            <Text style={styles.title}>{`Tongo Account (${tokenName})`}</Text>
            <AddressView address={account.tongoAddress()}/>

            <View style={{flex: 1, flexDirection: "row", justifyContent: "space-between"}}>
                <View>
                    <BalanceView label={"Balance"} balance={state.balance}/>
                    <BalanceView label={"Pending"} balance={state.balance}/>
                    <BalanceView label={"Nonce"} balance={state.nonce}/>
                </View>

                <View style={{alignItems: "flex-start"}}>
                    <Button
                        title={"Refresh"}
                        onPress={onRefreshBalance}
                    />
                </View>
            </View>

            <BalanceInput
                tokenName={""}
                action={"Fund"}
                placeholder={`Fund amount...`}
                onAction={(balance) => {
                    // Tongo balances are integer (32-bit). Do not scale by 1e18.
                    const amount = numberToBigInt(balance, 0);
                    onFund(amount)
                }}/>

            {state.balance > 0 && (
                <>
                    <Text>Transfer</Text>

                    {!recipient && (
                        <TongoAddressInput
                            placeholder={"Type recipient..."}
                            setRecipient={setRecipient}
                        />
                    )}

                    {recipient && (
                        <>
                            <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                                <Text>{"Recipient:"}</Text>

                                <Pressable onPress={() => {
                                    setRecipient(null)
                                }}>
                                    <IconSymbol
                                        size={16}
                                        color="#808080"
                                        name="trash.fill"
                                    />
                                </Pressable>
                            </View>

                            <Text>{recipient}</Text>
                        </>
                    )}

                    <BalanceInput
                        tokenName={""}
                        action={"Transfer"}
                        placeholder={`Transferable amount...`}
                        onAction={(balance) => {
                            if (recipient) {
                                const amount = numberToBigInt(balance, 0);
                                onTransfer(amount, recipient)
                            }
                        }}
                    />
                </>
            )}

        </View>
    );
}

function BalanceView({label, balance}: { label: string, balance: bigint }) {
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
