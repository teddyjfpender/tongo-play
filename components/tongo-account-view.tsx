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
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import ViewToggle from '@/components/ui/view-toggle';
import { useViewModeStore } from '@/stores/useViewModeStore';
import { Abi, Contract, uint256 } from 'starknet';

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
    const router = useRouter();
    const {
        tongoAccount,
        tongoAccountState,
        starknetAccount,
        provider,
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
    const theme = useColorScheme() ?? 'light';
    const themeColors = Colors[theme];
    const { mode } = useViewModeStore();
    const [publicBalance, setPublicBalance] = useState<bigint | null>(null);

    async function fetchPublicBalance() {
        if (!starknetAccount) return;
        const erc20Address = "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D";
        const erc20Abi: Abi = [
            { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'felt' }], outputs: [{ name: 'balance', type: 'Uint256' }], stateMutability: 'view' },
            { type: 'struct', name: 'Uint256', members: [{ name: 'low', type: 'felt' }, { name: 'high', type: 'felt' }] },
        ] as unknown as Abi;
        const erc20 = new Contract({ abi: erc20Abi, address: erc20Address, providerOrAccount: provider });
        const result = await (erc20 as any).balanceOf(starknetAccount.address);
        const { low, high } = result.balance;
        const bal = uint256.uint256ToBN({ low, high });
        setPublicBalance(BigInt(bal.toString()));
    }

    useEffect(() => {
        if (mode === 'public') {
            void fetchPublicBalance();
        }
    }, [mode, starknetAccount]);

    return (
        <View style={[style, {gap: 12}] }>
            {/* Top bar with refresh */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ViewToggle />
                <Pressable onPress={() => { const run = async () => { setIsRefreshing(true); try { mode === 'confidential' ? await refreshBalance() : await fetchPublicBalance(); } finally { setIsRefreshing(false); } }; void run(); }}>
                    {isRefreshing ? (
                        <ActivityIndicator size={16} color={themeColors.text as string} />
                    ) : (
                        <IconSymbol name={'arrow.clockwise'} size={18} color={themeColors.text} />
                    )}
                </Pressable>
            </View>

            {/* Balance + unit */}
            <View style={{ flexDirection: 'row', alignSelf: 'center', alignItems: 'flex-end', gap: 6 }}>
                <Text style={{ fontSize: 36, fontWeight: '700', color: themeColors.text }}>
                    {mode === 'confidential' ? tongoAccountState.balance : (publicBalance != null ? (publicBalance / 1000000000000000000n).toString() : '—')}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: themeColors.icon, marginBottom: 4 }}>STRK</Text>
            </View>

            {/* Address pill */}
            {mode === 'confidential' ? (
                <AddressPill value={shortTongo} copyValue={tongoBase58} />
            ) : (
                <AddressPill value={`${starknetAccount.address.slice(0,6)}...${starknetAccount.address.slice(-4)}`} copyValue={starknetAccount.address} />
            )}

            {mode === 'confidential' ? (
                <ActionRow
                    actions={[
                        { key: 'fund', icon: 'plus.circle.fill', label: 'Fund', onPress: () => router.push('/fund') },
                        { key: 'transfer', icon: 'paperplane.fill', label: 'Transfer', onPress: () => router.push('/transfer'), disabled: tongoAccountState.balance <= 0 },
                        { key: 'rollover', icon: 'arrow.clockwise', label: 'Rollover', onPress: async () => { setIsRollingOver(true); try { await rollover(); } finally { setIsRollingOver(false); } }, disabled: tongoAccountState.pending <= 0 },
                        { key: 'withdraw', icon: 'arrow.down.circle.fill', label: 'Withdraw', onPress: () => router.push('/withdraw'), disabled: tongoAccountState.balance <= 0 },
                    ]}
                />
            ) : (
                <ActionRow
                    actions={[
                        { key: 'fund', icon: 'plus.circle.fill', label: 'Fund', onPress: () => {} },
                        { key: 'transfer', icon: 'paperplane.fill', label: 'Transfer', onPress: () => {} },
                    ]}
                />
            )}

            {/* Descriptions moved into accordion below */}


            {mode === 'confidential' && (
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
            )}

            {/* Operation modals removed: operations now have full-screen routes */}
        </View>
    );
}

export default TongoAccountView;
