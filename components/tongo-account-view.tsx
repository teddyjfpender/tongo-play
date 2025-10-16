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
import OperationCard from "@/components/ui/operation-card";
import ActionRow from "@/components/ui/action-row";
import OperationModal from "@/components/ui/operation-modal";

export type AccountStateViewProps = {
    style?: StyleProp<ViewStyle>,
    tokenName: string,
    account: Account
}

function TongoAccountView({style, tokenName, account}: AccountStateViewProps) {
    const [recipient, setRecipient] = useState<string | null>(null);
    const [isFunding, setIsFunding] = useState<boolean>(false);
    const [isTransfering, setIsTransfering] = useState<boolean>(false);
    const [isRollingOver, setIsRollingOver] = useState<boolean>(false);
    const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
    const [showFund, setShowFund] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const {
        tongoAccount,
        tongoAccountState,
        fund,
        withdraw,
        transfer,
        rollover
    } = useAccountStore();

    if (!tongoAccountState || !tongoAccount) return null;

    return (
        <View style={[style, {gap: 12}] }>
            <AddressView address={tongoAccount.tongoAddress()}/>

            <ActionRow
                actions={[
                    { key: 'fund', icon: 'plus.circle.fill', label: 'Fund', onPress: () => setShowFund(true) },
                    { key: 'transfer', icon: 'paperplane.fill', label: 'Transfer', onPress: () => setShowTransfer(true), disabled: tongoAccountState.balance <= 0 },
                    { key: 'rollover', icon: 'arrow.clockwise', label: 'Rollover', onPress: async () => { setIsRollingOver(true); try { await rollover(); } finally { setIsRollingOver(false); } }, disabled: tongoAccountState.pending <= 0 },
                    { key: 'withdraw', icon: 'arrow.down.circle.fill', label: 'Withdraw', onPress: () => setShowWithdraw(true), disabled: tongoAccountState.balance <= 0 },
                ]}
            />

            <OperationCard title={"Summary"}>
                <Balance />
            </OperationCard>

            <OperationCard
                title={"Fund"}
                description={"Move public STRK into your confidential balance."}
            >
                <Text>{"Move funds into Tongo when you want privacy."}</Text>
            </OperationCard>

            {tongoAccountState.balance > 0 && (
                <OperationCard
                    title={"Transfer"}
                    description={"Send confidential STRK to another Tongo address."}
                >
                    <Text>{"Send confidential STRK to another Tongo address."}</Text>
                </OperationCard>
            )}

            {tongoAccountState.pending > 0 && (
                <OperationCard
                    title={"Rollover"}
                    description={"Consolidate pending outputs into your spendable balance."}
                    actionLabel={"Rollover"}
                    loading={isRollingOver}
                    onAction={() => {
                        const run = async () => {
                            setIsRollingOver(true);
                            try { await rollover(); } catch (e) { console.error(e); }
                            setIsRollingOver(false);
                        };
                        void run();
                    }}
                >
                    <Text>{`You have ${tongoAccountState.pending} pending.`}</Text>
                </OperationCard>
            )}

            {tongoAccountState.balance > 0 && (
                <OperationCard title={"Withdraw"} description={"Exit back to your Starknet account."}>
                    <Text>{"Withdraw converts your confidential balance back to your public STRK."}</Text>
                </OperationCard>
            )}

            {/* Fund Modal */}
            <OperationModal title="Fund" visible={showFund} onClose={() => setShowFund(false)}>
                <BalanceInput
                    tokenName={""}
                    action={"Fund"}
                    placeholder={`Amount to fund...`}
                    isLoading={isFunding}
                    onAction={(balance) => {
                        const fundOp = async (amount: bigint) => {
                            setIsFunding(true);
                            try { await fund(amount); } catch (e) { console.error(e) }
                            setIsFunding(false); setShowFund(false);
                        }
                        const amount = numberToBigInt(balance, 0);
                        void fundOp(amount)
                    }}
                />
            </OperationModal>

            {/* Transfer Modal */}
            <OperationModal title="Transfer" visible={showTransfer} onClose={() => setShowTransfer(false)}>
                {!recipient && (
                    <TongoAddressInput placeholder={"Type recipient..."} setRecipient={setRecipient} />
                )}
                {recipient && (
                    <>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <Text>{"Recipient:"}</Text>
                            <Pressable onPress={() => { setRecipient(null) }}>
                                <IconSymbol size={16} color="#808080" name="trash.fill" />
                            </Pressable>
                        </View>
                        <Text>{recipient}</Text>
                    </>
                )}
                <BalanceInput
                    tokenName={""}
                    action={"Transfer"}
                    isLoading={isTransfering}
                    placeholder={`Amount to transfer...`}
                    onAction={(balance) => {
                        const transferOp = async (amount: bigint, recipient: string) => {
                            setIsTransfering(true)
                            try { await transfer(amount, recipient) } catch (e) { console.error(e) }
                            setIsTransfering(false); setShowTransfer(false);
                        };
                        if (recipient) {
                            const amount = numberToBigInt(balance, 0);
                            void transferOp(amount, recipient)
                        }
                    }}
                />
            </OperationModal>

            {/* Withdraw Modal */}
            <OperationModal title="Withdraw" visible={showWithdraw} onClose={() => setShowWithdraw(false)}>
                <BalanceInput
                    tokenName={""}
                    action={"Withdraw"}
                    isLoading={isWithdrawing}
                    placeholder={`Amount to withdraw...`}
                    onAction={(balance) => {
                        const withdrawOp = async (amount: bigint) => {
                            setIsWithdrawing(true)
                            try { await withdraw(amount) } catch (e) { console.error(e) }
                            setIsWithdrawing(false); setShowWithdraw(false);
                        };
                        const amount = numberToBigInt(balance, 0);
                        if (amount <= tongoAccountState?.balance) {
                            void withdrawOp(amount)
                        }
                    }}
                />
            </OperationModal>
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
