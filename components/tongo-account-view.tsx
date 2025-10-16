import {Account, AccountState} from "@fatsolutions/tongo-sdk";
import {Button, Pressable, StyleProp, StyleSheet, Text, TextInput, View, ViewStyle} from "react-native";
import {AddressView} from "@/components/address-view";
import BalanceInput from "@/components/balance-input";
import numberToBigInt from "@/utils/numberToBigInt";
import TongoAddressInput from "@/components/tongo-address-input";
import {useEffect, useState} from "react";
import {ProjectivePoint, projectivePointToStarkPoint, pubKeyBase58ToAffine} from "@fatsolutions/tongo-sdk/src/types";
import {IconSymbol} from "@/components/ui/icon-symbol";
import {useAccountStore} from "@/stores/useAccountStore";
import {ProgressButton} from "@/components/progress-button";

export type AccountStateViewProps = {
    style?: StyleProp<ViewStyle>,
    tokenName: string,
    account: Account
}

function TongoAccountView({style, tokenName, account}: AccountStateViewProps) {
    const [recipient, setRecipient] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [isRollingOver, setIsRollingOver] = useState<boolean>(false);
    const [isFunding, setIsFunding] = useState<boolean>(false);
    const [isTransfering, setIsTransfering] = useState<boolean>(false);
    const {
        tongoAccount,
        tongoAccountState,
        fund,
        refreshBalance,
        rollover,
        transfer
    } = useAccountStore();

    if (!tongoAccountState || !tongoAccount) return null;

    return (
        <View style={[style, {gap: 8}]}>
            <Text style={styles.title}>{`Tongo Account (${tokenName})`}</Text>
            <AddressView address={tongoAccount.tongoAddress()}/>

            <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                <View>
                    <BalanceView label={"Balance"} balance={tongoAccountState.balance}/>
                    <BalanceView label={"Pending"} balance={tongoAccountState.pending}/>
                    <BalanceView label={"Nonce"} balance={tongoAccountState.nonce}/>
                </View>

                {tongoAccountState.pending > 0 && (
                    <ProgressButton
                        title={"Rollover"}
                        isLoading={isRollingOver}
                        onPress={() => {
                            const rolloverOp = async () => {
                                setIsRollingOver(true)
                                try {
                                    await rollover();
                                } catch (e) {
                                    console.error(e)
                                }
                                setIsRollingOver(false)
                            };

                            void rolloverOp()
                        }}
                    />
                )}
            </View>
            <ProgressButton
                title={"Refresh"}
                isLoading={isRefreshing}
                onPress={() => {
                    const refresh = async () => {
                        setIsRefreshing(true);
                        try {
                            await refreshBalance();
                        } catch (e) {
                            console.error(e)
                        }
                        setIsRefreshing(false);
                    }

                    void refresh();
                }}
            />
            <BalanceInput
                tokenName={""}
                action={"Fund"}
                placeholder={`Fund amount...`}
                isLoading={isFunding}
                onAction={(balance) => {
                    const fundOp = async (amount: bigint) => {
                        setIsFunding(true);
                        try {
                            await fund(amount);
                        } catch (e) {
                            console.error(e)
                        }
                        setIsFunding(false);
                    }


                    const amount = numberToBigInt(balance, 0);
                    void fundOp(amount)
                }}/>

            {tongoAccountState.balance > 0 && (
                <>
                    <Text style={{fontWeight: "bold"}}>Transfer</Text>

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
                        isLoading={isTransfering}
                        placeholder={`Transferable amount...`}
                        onAction={(balance) => {
                            const transferOp = async (amount: bigint, recipient: string) => {
                                setIsTransfering(true)
                                try {
                                    await transfer(amount, recipient)
                                } catch (e) {
                                    console.error(e)
                                }
                                setIsTransfering(false)
                            };


                            if (recipient) {
                                const amount = numberToBigInt(balance, 0);
                                void transferOp(amount, recipient)
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
