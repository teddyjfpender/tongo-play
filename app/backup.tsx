import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useMnemonicStore } from '@/stores/useMnemonicStore';

export default function BackupScreen() {
  const { mnemonicWords } = useMnemonicStore();

  const hasMnemonic = Array.isArray(mnemonicWords) && mnemonicWords.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.block}>
        <Text style={styles.title}>Backup Your Recovery Phrase</Text>
        <Text style={styles.hint}>Never share these words with anyone.</Text>
      </View>

      {hasMnemonic ? (
        <View style={styles.wordsGrid}>
          {mnemonicWords!.map((w, i) => (
            <View key={`${w}-${i}`} style={styles.wordItem}>
              <Text style={styles.wordIndex}>{i + 1}.</Text>
              <Text style={styles.wordText}>{w}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.block}>
          <Text style={styles.noMnemonic}>No mnemonic found in memory.</Text>
          <Text style={styles.noMnemonicSub}>Create or restore a wallet first.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  block: {
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  hint: {
    color: '#888',
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  wordIndex: {
    color: '#666',
    marginRight: 6,
  },
  wordText: {
    fontWeight: '500',
  },
  noMnemonic: {
    fontSize: 16,
    fontWeight: '500',
  },
  noMnemonicSub: {
    color: '#666',
  },
});

