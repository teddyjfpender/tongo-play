import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

type ActionButtonProps = {
  icon: Parameters<typeof IconSymbol>[0]['name'];
  label: string;
  onPress?: () => void;
  disabled?: boolean;
};

export default function ActionButton({ icon, label, onPress, disabled }: ActionButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button">
      <View style={[styles.button, disabled && styles.buttonDisabled]}>
        <IconSymbol name={icon} size={24} color={disabled ? '#bbb' : '#fff'} />
      </View>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  label: {
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '600',
  },
  labelDisabled: {
    color: '#999',
  },
});

