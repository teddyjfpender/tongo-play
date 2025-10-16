import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '@/components/ui/section-card';
import BalanceInput from '@/components/balance-input';
import numberToBigInt from '@/utils/numberToBigInt';
import { useAccountStore } from '@/stores/useAccountStore';

export default function WithdrawScreen() {
  const router = useRouter();
  const { withdraw, tongoAccountState } = useAccountStore();
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>1/1 • Enter amount</Text>
      <SectionCard>
        <Text style={styles.title}>Withdraw to Starknet</Text>
        <Text style={styles.hint}>Exit back to your public STRK account.</Text>
        <BalanceInput
          tokenName={''}
          action={'Withdraw'}
          isLoading={isWithdrawing}
          placeholder={`Amount to withdraw...`}
          onAction={(val) => {
            const run = async () => {
              setIsWithdrawing(true);
              try {
                const amount = numberToBigInt(val, 0);
                if (tongoAccountState && amount <= tongoAccountState.balance) {
                  await withdraw(amount);
                  router.back();
                }
              } catch (e) {
                console.error(e);
              }
              setIsWithdrawing(false);
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

