import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useAccountStore } from '@/stores/useAccountStore';
import { useMnemonicStore } from '@/stores/useMnemonicStore';
import SectionCard from '@/components/ui/section-card';
import TextArea from '@/components/ui/text-area';
import Link from '@/components/ui/link';

export default function OnboardingScreen() {
  const {
    isInitialized,
    starknetAccount,
    initialize,
    generateMnemonic,
    restoreFromMnemonic,
  } = useAccountStore();
  const router = useRouter();
  const { setMnemonic, toWords, isValidMnemonic, clearMnemonic } = useMnemonicStore();
  const [restoreMnemonic, setRestoreMnemonic] = useState('');
  const words = useMemo(() => toWords(restoreMnemonic.trim()), [restoreMnemonic, toWords]);
  const wordCount = words.length;
  const allowedWordCounts = [12, 24];
  const isAllowedWordCount = allowedWordCounts.includes(wordCount);
  const isRestoreMnemonicValid = useMemo(() => isAllowedWordCount && isValidMnemonic(restoreMnemonic), [isAllowedWordCount, restoreMnemonic, isValidMnemonic]);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      void initialize();
    }
  }, [isInitialized, initialize]);

  useEffect(() => {
    if (starknetAccount) {
      router.replace('/');
    }
  }, [starknetAccount, router]);

  const handleCreateWallet = () => {
    const words = generateMnemonic();
    setMnemonic(words);
    void restoreFromMnemonic(words);
  };

  const handleRestoreWallet = async () => {
    if (!isRestoreMnemonicValid) return;
    try {
      setIsRestoring(true);
      clearMnemonic();
      const parsed = toWords(restoreMnemonic);
      await restoreFromMnemonic(parsed);
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setRestoreMnemonic(text);
  };

  const handleClear = () => setRestoreMnemonic('');

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, width: '100%', height: '100%', justifyContent: 'center' }}>
        <ActivityIndicator size={'large'} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionCard title={'Start a new wallet'}>
        <Text style={styles.sectionHint}>Creates a fresh wallet and takes you to home. You can back up the phrase anytime from the account page.</Text>
        <Button onPress={handleCreateWallet} title={'Create wallet'} />
      </SectionCard>

      <Text style={styles.orTextCentered}>OR</Text>

      <SectionCard title={'Restore from recovery phrase'}>
        <Text style={styles.sectionHint}>Paste your 12 or 24 words. Separate by spaces.</Text>
        <TextArea
          value={restoreMnemonic}
          placeholder={'twelve or twenty four words...'}
          onChangeText={setRestoreMnemonic}
          returnKeyType="done"
          onSubmitEditing={handleRestoreWallet}
        />
        <View style={styles.inlineActions}>
          <Link onPress={handlePaste}>Paste</Link>
          {restoreMnemonic.length > 0 && (
            <Link onPress={handleClear}>Clear</Link>
          )}
        </View>
        <View style={styles.validationRow}>
          <Text style={[styles.helperText, isAllowedWordCount ? styles.ok : styles.warn]}>Words: {wordCount} {isAllowedWordCount ? '' : `(use 12 or 24)`}</Text>
          {restoreMnemonic.length > 0 && (
            <Text style={[styles.helperText, isRestoreMnemonicValid ? styles.ok : styles.warn]}>{isRestoreMnemonicValid ? 'Looks good' : 'Invalid phrase'}</Text>
          )}
        </View>
        <Button
          onPress={handleRestoreWallet}
          disabled={!isRestoreMnemonicValid || isRestoring}
          title={isRestoring ? 'Restoring...' : 'Restore wallet'}
        />
      </SectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 16,
  },
  sectionHint: { color: '#666' },
  orTextCentered: { color: '#888', textAlign: 'center' },
  inlineActions: { flexDirection: 'row', gap: 16, marginTop: 6, marginBottom: 6 },
  validationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  helperText: { fontSize: 12 },
  ok: { color: '#1f8b4c' },
  warn: { color: '#c0392b' },
});
