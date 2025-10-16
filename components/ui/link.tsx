import React from 'react';
import { Pressable, StyleSheet, Text, TextProps } from 'react-native';

type LinkProps = TextProps & { onPress?: () => void };

export default function Link({ onPress, style, children, ...rest }: LinkProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Text style={[styles.link, style]} {...rest}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    color: '#007AFF',
    fontWeight: '500',
  },
});

