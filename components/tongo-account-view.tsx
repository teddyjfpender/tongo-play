import {Account, AccountState} from "@fatsolutions/tongo-sdk";
import {
    ActivityIndicator,
    Button,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    View,
    ViewStyle
} from "react-native";
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
    const [isFunding, setIsFunding] = useState<boolean>(false);
    const [isTransfering, setIsTransfering] = useState<boolean>(false);
    const {
        tongoAccount,
        tongoAccountState,
        fund,
        refreshBalance,
        transfer
    } = useAccountStore();

    if (!tongoAccountState || !tongoAccount) return null;

    return (
        <View style={[style, {gap: 8}]}>
            <Text style={styles.title}>{`Tongo Account (${tokenName})`}</Text>
            <AddressView address={tongoAccount.tongoAddress()}/>

            <Balance />
            
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

function Balance() {
    const {
        tongoAccountState,
        refreshBalance,
        rollover
    } = useAccountStore();
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [isRollingOver, setIsRollingOver] = useState<boolean>(false);

    if (!tongoAccountState) return null;

    return (
        <View>
            <View style={balanceStyles.header}>
                <Text>{`Nonce: ${tongoAccountState.nonce}`}</Text>

                <Pressable onPress={() => {
                    const refreshOp = async () => {
                        setIsRefreshing(true);
                        await refreshBalance();
                        setIsRefreshing(false);
                    }

                    void refreshOp();
                }}>
                    {isRefreshing ? (
                        <ActivityIndicator
                            size={16}
                            color={"black"}
                        />
                    ) : (
                        <IconSymbol name={"arrow.clockwise"} size={16} color={"black"} />
                    )}
                </Pressable>
            </View>
            <View style={balanceStyles.container}>
                <View style={balanceStyles.balanceContainer}>
                    <Text style={balanceStyles.title}>Balance</Text>
                    <Text style={balanceStyles.balance}>{tongoAccountState.balance}</Text>
                </View>

                <View style={balanceStyles.balanceContainer}>
                    <Text style={balanceStyles.title}>Pending</Text>
                    <Text style={balanceStyles.balance}>{tongoAccountState.pending}</Text>

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
            </View>
        </View>

    );
}

export default TongoAccountView;

const styles = StyleSheet.create({
    title: {
        fontWeight: "bold",
        fontSize: 24,
    }
})

const balanceStyles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderLeftWidth: 1,
        borderTopWidth: 1,
        borderRightWidth: 1,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    container: {
        flexDirection: "row",
    },
    balanceContainer: {
        flex: 1,
        borderWidth: 1,
        padding: 8,
        gap: 4
    },
    title: {
        fontWeight: "bold",
        alignSelf: "center",
    },
    balance: {
        alignSelf: "center",
    }
})
