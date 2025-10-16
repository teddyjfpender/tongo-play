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
import AddressPill from "@/components/ui/address-pill";
import { Collapsible } from "@/components/ui/collapsible";
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
        rollover,
        refreshBalance
    } = useAccountStore();

    if (!tongoAccountState || !tongoAccount) return null;

    // helper to truncate base58 address
    const tongoBase58 = tongoAccount.tongoAddress();
    const shortTongo = tongoBase58.length > 10 ? `${tongoBase58.slice(0,5)}...${tongoBase58.slice(-6)}` : tongoBase58;

    const [isRefreshing, setIsRefreshing] = useState(false);

    return (
        <View style={[style, {gap: 12}] }>
            {/* Top bar with refresh */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <Pressable onPress={() => { const run = async () => { setIsRefreshing(true); try { await refreshBalance(); } finally { setIsRefreshing(false); } }; void run(); }}>
                    {isRefreshing ? (
                        <ActivityIndicator size={16} color={'black'} />
                    ) : (
                        <IconSymbol name={'arrow.clockwise'} size={18} color={'black'} />
                    )}
                </Pressable>
            </View>

            {/* Balance + unit */}
            <View style={{ flexDirection: 'row', alignSelf: 'center', alignItems: 'flex-end', gap: 6 }}>
                <Text style={{ fontSize: 36, fontWeight: '700' }}>{tongoAccountState.balance}</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 4 }}>STRK</Text>
            </View>

            {/* Address pill */}
            <AddressPill value={shortTongo} copyValue={tongoBase58} />

            <ActionRow
                actions={[
                    { key: 'fund', icon: 'plus.circle.fill', label: 'Fund', onPress: () => setShowFund(true) },
                    { key: 'transfer', icon: 'paperplane.fill', label: 'Transfer', onPress: () => setShowTransfer(true), disabled: tongoAccountState.balance <= 0 },
                    { key: 'rollover', icon: 'arrow.clockwise', label: 'Rollover', onPress: async () => { setIsRollingOver(true); try { await rollover(); } finally { setIsRollingOver(false); } }, disabled: tongoAccountState.pending <= 0 },
                    { key: 'withdraw', icon: 'arrow.down.circle.fill', label: 'Withdraw', onPress: () => setShowWithdraw(true), disabled: tongoAccountState.balance <= 0 },
                ]}
            />

            {/* Descriptions moved into accordion below */}


            <Collapsible title="How does this work?">
                <View style={{ gap: 8 }}>
                    <OperationCard title={"Fund"} description={"Move public STRK into your confidential balance."}>
                        <Text>{"Move funds into Tongo when you want privacy."}</Text>
                    </OperationCard>
                    <OperationCard title={"Transfer"} description={"Send confidential STRK to another Tongo address."}>
                        <Text>{"Transfers are shielded within the Tongo system."}</Text>
                    </OperationCard>
                    <OperationCard title={"Withdraw"} description={"Exit back to your public Starknet account."}>
                        <Text>{"Withdraw when you want to return funds to your regular STRK balance."}</Text>
                    </OperationCard>
                </View>
            </Collapsible>

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

export default TongoAccountView;
