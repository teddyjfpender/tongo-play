import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '@/components/ui/section-card';
import BalanceInput from '@/components/balance-input';
import numberToBigInt from '@/utils/numberToBigInt';
import { useAccountStore } from '@/stores/useAccountStore';
import TongoAddressInput from '@/components/tongo-address-input';

export default function TransferScreen() {
  const router = useRouter();
  const { transfer } = useAccountStore();
  const [recipient, setRecipient] = useState<string | null>(null);
  const [isTransfering, setIsTransfering] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>1/2 • Choose recipient</Text>
      <SectionCard>
        <Text style={styles.title}>Send confidential STRK</Text>
        <Text style={styles.hint}>Enter the recipient's Tongo address.</Text>
        <TongoAddressInput placeholder={'Type recipient...'} setRecipient={setRecipient} />
      </SectionCard>

      <Text style={styles.progress}>2/2 • Enter amount</Text>
      <SectionCard>
        <BalanceInput
          tokenName={''}
          action={'Transfer'}
          isLoading={isTransfering}
          placeholder={`Amount to transfer...`}
          onAction={(val) => {
            if (!recipient) return;
            const run = async () => {
              setIsTransfering(true);
              try {
                const amount = numberToBigInt(val, 0);
                await transfer(amount, recipient);
                router.back();
              } catch (e) {
                console.error(e);
              }
              setIsTransfering(false);
            };
            void run();
          }}
        />
      </SectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: '600' },
  hint: { color: '#666' },
  progress: { color: '#888', fontWeight: '600' },
});

