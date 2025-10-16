import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '@/components/ui/section-card';
import BalanceInput from '@/components/balance-input';
import numberToBigInt from '@/utils/numberToBigInt';
import { useAccountStore } from '@/stores/useAccountStore';

export default function FundScreen() {
  const router = useRouter();
  const { fund } = useAccountStore();
  const [isFunding, setIsFunding] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>1/1 • Enter amount</Text>
      <SectionCard>
        <Text style={styles.title}>Fund your confidential balance</Text>
        <Text style={styles.hint}>Move public STRK into your confidential balance.</Text>

        <BalanceInput
          tokenName={''}
          action={'Fund'}
          isLoading={isFunding}
          placeholder={`Amount to fund...`}
          onAction={(val) => {
            const run = async () => {
              setIsFunding(true);
              try {
                const amount = numberToBigInt(val, 0);
                await fund(amount);
                router.back();
              } catch (e) {
                console.error(e);
              }
              setIsFunding(false);
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

