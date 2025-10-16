import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useViewModeStore } from '@/stores/useViewModeStore';

export default function ViewToggle() {
  const theme = useColorScheme() ?? 'light';
  const c = Colors[theme];
  const { mode, setMode } = useViewModeStore();

  return (
    <View style={[styles.container, { borderColor: c.icon }]}> 
      <Pressable style={[styles.segment, mode === 'confidential' && { backgroundColor: c.tint }]} onPress={() => setMode('confidential')}>
        <Text style={[styles.label, { color: mode === 'confidential' ? c.background : c.text }]}>Confidential</Text>
      </Pressable>
      <Pressable style={[styles.segment, mode === 'public' && { backgroundColor: c.tint }]} onPress={() => setMode('public')}>
        <Text style={[styles.label, { color: mode === 'public' ? c.background : c.text }]}>Public</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderWidth: 1, borderRadius: 999, overflow: 'hidden' },
  segment: { paddingVertical: 6, paddingHorizontal: 12 },
  label: { fontWeight: '600' },
});

