import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, FlatList } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import SectionCard from '@/components/ui/section-card';
import { useAddressBookStore } from '@/stores/useAddressBookStore';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { pubKeyBase58ToAffine } from '@fatsolutions/tongo-sdk/src/types';

export default function TransferSelectRecipient() {
  const router = useRouter();
  const { contacts, initialize, addContact, initialized } = useAddressBookStore();
  const theme = useColorScheme() ?? 'light';
  const themeColors = Colors[theme];
  const [input, setInput] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { void initialize(); }, [initialize]);

  const isValid = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return false;
    try { pubKeyBase58ToAffine(trimmed); return true; } catch { return false; }
  }, [input]);

  const goNext = (recipient: string) => {
    router.push({ pathname: '/transfer/amount', params: { recipient } });
  };

  return (
    <View style={styles.container}>
      <SectionCard right={<Pressable onPress={() => setShowAdd((v) => !v)}><IconSymbol name={'plus.circle.fill'} color={themeColors.text} size={22} /></Pressable>}>
        <Text style={styles.title}>Send to</Text>
        <Text style={[styles.hint, { color: themeColors.icon }]}>Address (base58 Tongo public key)</Text>
        <TextInput
          style={[
            styles.input,
            input.length === 0
              ? null
              : isValid
              ? { borderColor: themeColors.tint }
              : { borderColor: themeColors.icon },
          ]}
          placeholder={'u.... (Tongo address)'}
          value={input}
          onChangeText={setInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          style={[styles.primary, { backgroundColor: isValid ? themeColors.tint : themeColors.icon }]}
          disabled={!isValid}
          onPress={() => goNext(input.trim())}
        >
          <Text style={styles.primaryText}>Continue</Text>
        </Pressable>
      </SectionCard>

      {showAdd && isValid && (
        <SectionCard>
          <Text style={styles.subtitle}>Add to address book</Text>
          <AddContactRow address={input} onSave={async (name) => { await addContact({ name, address: input }); setShowAdd(false); }} />
        </SectionCard>
      )}

      {initialized && contacts.length > 0 && (
        <SectionCard>
          <Text style={styles.subtitle}>Address book</Text>
          <FlatList
            data={contacts}
            keyExtractor={(c) => c.address}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <Pressable style={[styles.contactRow, { borderColor: themeColors.icon, backgroundColor: themeColors.background }]} onPress={() => goNext(item.address)}>
                <ContactAvatar name={item.name} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactName, { color: themeColors.text }]}>{item.name}</Text>
                  <Text numberOfLines={1} style={[styles.contactAddr, { color: themeColors.icon }]}>{item.address}</Text>
                </View>
                <IconSymbol name={'chevron.right'} color={themeColors.icon} size={18} />
              </Pressable>
            )}
          />
        </SectionCard>
      )}
    </View>
  );
}

function AddContactRow({ address, onSave }: { address: string; onSave: (name: string) => void }) {
  const [name, setName] = useState('');
  const canSave = name.trim().length > 0;
  return (
    <View style={{ gap: 8 }}>
      <TextInput style={styles.input} placeholder={'Contact name'} value={name} onChangeText={setName} />
      <Pressable style={[styles.primary, !canSave && styles.primaryDisabled]} disabled={!canSave} onPress={() => onSave(name.trim())}>
        <Text style={styles.primaryText}>Save contact</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: '600' },
  subtitle: { fontSize: 16, fontWeight: '600' },
  hint: { color: '#666' },
  input: { borderWidth: 1, padding: 12, borderRadius: 10 },
  primary: { marginTop: 8, alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  primaryText: { color: 'white', fontWeight: '600' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderRadius: 12 },
  contactName: { fontWeight: '600' },
  contactAddr: { maxWidth: 220 },
});

function ContactAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const theme = useColorScheme() ?? 'light';
  const themeColors = Colors[theme];
  return (
    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: themeColors.tint, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: themeColors.background, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}
