import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type AddressPillProps = {
  value: string; // truncated to display
  copyValue?: string; // full value to copy
  center?: boolean; // default true; when false, left-align
  copyable?: boolean; // default true
};

export default function AddressPill({ value, copyValue, center = true, copyable = true }: AddressPillProps) {
  const theme = useColorScheme() ?? 'light';
  const themeColors = Colors[theme];
  const copy = async () => {
    await Clipboard.setStringAsync(copyValue ?? value);
  };
  return (
    <View style={[styles.row, !center && { alignSelf: 'flex-start' }]}>
      <View style={[styles.pill, { backgroundColor: themeColors.icon + '22' }]}>
        <Text style={[styles.text, { color: themeColors.text }]}>{value}</Text>
      </View>
      {copyable && (
        <Pressable onPress={copy} accessibilityLabel="Copy address">
          <Ionicons name="copy-outline" size={18} color={themeColors.icon as string} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center' },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  text: { fontWeight: '600' },
});
