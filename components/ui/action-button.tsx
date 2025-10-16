import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

type ActionButtonProps = {
  icon: Parameters<typeof IconSymbol>[0]['name'];
  label: string;
  onPress?: () => void;
  disabled?: boolean;
};

export default function ActionButton({ icon, label, onPress, disabled }: ActionButtonProps) {
  const theme = useColorScheme() ?? 'light';
  const themeColors = Colors[theme];
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button">
      <View style={[styles.button, { backgroundColor: disabled ? themeColors.icon : themeColors.text }]}>
        <IconSymbol name={icon} size={24} color={themeColors.background} />
      </View>
      <Text style={[styles.label, { color: disabled ? themeColors.icon : themeColors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  label: {
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '600',
  },
});
