import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SectionCard from '@/components/ui/section-card';
import BalanceInput from '@/components/balance-input';
import numberToBigInt from '@/utils/numberToBigInt';
import { useAccountStore } from '@/stores/useAccountStore';
import { useAddressBookStore } from '@/stores/useAddressBookStore';
import AddressPill from '@/components/ui/address-pill';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function truncate(addr: string) {
  return addr.length > 10 ? `${addr.slice(0,5)}...${addr.slice(-6)}` : addr;
}

export default function TransferAmount() {
  const { recipient } = useLocalSearchParams<{ recipient: string }>();
  const router = useRouter();
  const { transfer, tongoAccountState } = useAccountStore();
  const [isTransfering, setIsTransfering] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const rec = useMemo(() => (typeof recipient === 'string' ? recipient : ''), [recipient]);
  const theme = useColorScheme() ?? 'light';
  const themeColors = Colors[theme];
  const { contacts, initialize, initialized } = useAddressBookStore();

  // Ensure address book is loaded to resolve display name
  useEffect(() => { void initialize(); }, [initialize]);

  const recipientLabel = useMemo(() => {
    const match = contacts.find((c) => c.address === rec);
    return match ? match.name : truncate(rec);
  }, [contacts, rec]);

  const exceeds = useMemo(() => {
    if (!tongoAccountState || amount == null) return false;
    return amount > Number(tongoAccountState.balance);
  }, [tongoAccountState, amount]);

  return (
    <View style={styles.container}>
      <Text style={[styles.progress, { color: themeColors.icon }]}>2/2 • Enter amount</Text>

      {/* Asset section */}
      <SectionCard title="Asset">
        <View style={[styles.assetBox, { borderColor: themeColors.icon, backgroundColor: themeColors.background }]}>
          <View style={{ marginTop: 0 }}>
            <BalanceInput
              tokenName={'STRK'}
              action={'Transfer'}
              isLoading={isTransfering}
              placeholder={`Amount to transfer...`}
              variant={'soft'}
              showAction={false}
              onValueChange={(v) => setAmount(v)}
              value={amount}
              onAction={() => {}}
            />
          </View>
          {/* Inline validation */}
          {exceeds && (
            <Text style={{ marginTop: 6, color: themeColors.danger, fontWeight: '600' }}>
              Amount exceeds available balance
            </Text>
          )}
          {tongoAccountState && (
            <View style={styles.assetBottomRow}>
              <Pressable
                disabled={!tongoAccountState || tongoAccountState.balance === 0}
                onPress={() => {
                  // Populate input with max available instead of auto-sending
                  const maxVal = Number(tongoAccountState!.balance);
                  setAmount(maxVal);
                }}
              >
                <Text style={{ color: themeColors.tint, fontWeight: '600' }}>Max</Text>
              </Pressable>
              <Text style={[styles.balanceHint, { color: themeColors.icon }]}>Balance: {tongoAccountState.balance} STRK</Text>
            </View>
          )}
        </View>
      </SectionCard>

      {/* Recipient section */}
      <SectionCard
        title="Recipient"
        right={<Pressable onPress={() => router.back()}><Text style={{ color: themeColors.tint, fontWeight: '600' }}>Change</Text></Pressable>}
      >
        <AddressPill value={recipientLabel} copyValue={rec} center={false} copyable={false} />
      </SectionCard>

      {/* Bottom wide Transfer button */}
      <Pressable
        style={[
          styles.primaryWide,
          { backgroundColor: amount && amount > 0 && !exceeds ? themeColors.tint : themeColors.icon },
        ]}
        disabled={!amount || amount <= 0 || exceeds || isTransfering}
        onPress={() => {
          if (!amount || amount <= 0) return;
          const run = async () => {
            setIsTransfering(true);
            try {
              const amt = numberToBigInt(amount, 0);
              await transfer(amt, rec);
              router.replace('/');
            } catch (e) { console.error(e); }
            setIsTransfering(false);
          };
          void run();
        }}
      >
        <Text style={{ color: themeColors.background, textAlign: 'center', fontWeight: '700' }}>Transfer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  progress: { color: '#888', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '600' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceHint: { color: '#666' },
  recipientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  recipientLabel: { color: '#666' },
  recipientValue: { fontWeight: '600', fontSize: 16 },
  link: { color: '#007AFF', fontWeight: '600' },
  assetBox: { borderRadius: 12, padding: 12, borderWidth: 1 },
  assetTopRow: { },
  tokenPill: { },
  tokenPillText: { },
  assetBottomRow: { marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  primaryWide: { marginTop: 12, paddingVertical: 14, borderRadius: 12 },
});
