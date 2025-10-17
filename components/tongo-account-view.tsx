import {Account} from "@fatsolutions/tongo-sdk";
import {ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle} from "react-native";
import {AddressView} from "@/components/address-view";
import BalanceInput from "@/components/balance-input";
import toSafeBigint from "@/utils/toSafeBigint";
import TongoAddressInput from "@/components/tongo-address-input";
import {useState} from "react";
import {IconSymbol} from "@/components/ui/icon-symbol";
import {useAccountStore} from "@/stores/useAccountStore";
import {ProgressButton} from "@/components/progress-button";
import formattedBalance from "@/utils/formattedBalance";

export type AccountStateViewProps = {
    style?: StyleProp<ViewStyle>,
    tokenName: string,
    account: Account
}

function TongoAccountView({style, tokenName, account}: AccountStateViewProps) {
    const [recipient, setRecipient] = useState<string | null>(null);
    const [isFunding, setIsFunding] = useState<boolean>(false);
    const [isTransfering, setIsTransfering] = useState<boolean>(false);
    const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
    const [isRageQuitting, setIsRageQuitting] = useState<boolean>(false);
    const {
        tongoAccount,
        tongoBalance,
        fund,
        withdraw,
        transfer,
        ragequit,
    } = useAccountStore();

    if (!tongoBalance || !tongoAccount) return null;

    return (
        <View style={[style, {gap: 8}]}>
            <Text style={styles.title}>{`Confidential (${tokenName})`}</Text>
            <AddressView address={tongoAccount.tongoAddress()}/>

            <Balance tokenName={tokenName} />

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


                    const amount = toSafeBigint(balance);
                    void fundOp(amount)
                }}/>

            {/*Transfer*/}
            {tongoBalance.tongoBalance > 0 && (
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
                                const amount = toSafeBigint(balance);
                                void transferOp(amount, recipient)
                            }
                        }}
                    />
                </>
            )}

            {/*Withdraw*/}
            {tongoBalance.tongoBalance > 0 && (
                <>
                    <Text style={{fontWeight: "bold"}}>Withdraw</Text>

                    <BalanceInput
                        tokenName={""}
                        action={"Withdraw"}
                        isLoading={isWithdrawing}
                        placeholder={`Withdrawing amount...`}
                        onAction={(balance) => {
                            const withdrawOp = async (amount: bigint) => {
                                setIsWithdrawing(true)
                                try {
                                    await withdraw(amount);
                                } catch (e) {
                                    console.error(e)
                                }
                                setIsWithdrawing(false)
                            };

                            const amount = toSafeBigint(balance);
                            if (amount <= tongoBalance?.tongoBalance) {
                                void withdrawOp(amount)
                            }
                        }}
                    />
                </>
            )}

            {/*Ragequit*/}
            {tongoBalance.tongoBalance > 0 && (
                <ProgressButton
                    title={"Ragequit"}
                    isLoading={isRageQuitting}
                    color={"red"}
                    onPress={() => {
                        const ragequitOp = async () => {
                            setIsRageQuitting(true)
                            try {
                                await ragequit();
                            } catch (e) {
                                console.log(e)
                            }
                            setIsRageQuitting(false)
                        };

                        void ragequitOp();
                    }}
                />
            )}
        </View>
    );
}

function Balance({tokenName}: {tokenName: string}) {
    const {
        tongoBalance,
        refreshBalance,
        rollover
    } = useAccountStore();
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [isRollingOver, setIsRollingOver] = useState<boolean>(false);

    if (!tongoBalance) return null;

    return (
        <View>
            <View style={balanceStyles.header}>
                <Text>{`Nonce: ${tongoBalance.nonce}`}</Text>

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
                    <View>
                        <Text style={balanceStyles.balance}>{tongoBalance.tongoBalance}</Text>
                        <Text style={balanceStyles.balanceERC20}>{`≈ ${formattedBalance(tongoBalance.erc20Balance, 18)} ${tokenName}`}</Text>
                    </View>

                </View>

                <View style={balanceStyles.balanceContainer}>
                    <Text style={balanceStyles.title}>Pending</Text>
                    <View>
                        <Text style={balanceStyles.balance}>{tongoBalance.tongoPendingBalance}</Text>
                        <Text style={balanceStyles.balanceERC20}>{`≈ ${formattedBalance(tongoBalance.erc20pendingBalance, 18)} ${tokenName}`}</Text>
                    </View>

                    {tongoBalance.tongoPendingBalance > 0 && (
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
        color: "black",
    },
    balanceERC20: {
        alignSelf: "center",
        color: "#686565"
    }
})
