import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

type AddressPillProps = {
  value: string; // truncated to display
  copyValue?: string; // full value to copy
};

export default function AddressPill({ value, copyValue }: AddressPillProps) {
  const copy = async () => {
    await Clipboard.setStringAsync(copyValue ?? value);
  };
  return (
    <View style={styles.row}>
      <View style={styles.pill}>
        <Text style={styles.text}>{value}</Text>
      </View>
      <Pressable onPress={copy} accessibilityLabel="Copy address">
        <Ionicons name="copy-outline" size={18} color="#666" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center' },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#efefef',
    borderRadius: 999,
  },
  text: { fontWeight: '600' },
});

