import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

export type TextAreaProps = TextInputProps & { height?: number };

export default function TextArea({ height = 100, style, ...rest }: TextAreaProps) {
  return (
    <TextInput
      style={[styles.input, { minHeight: height }, style]}
      multiline
      autoCapitalize="none"
      autoCorrect={false}
      textAlignVertical="top"
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
});

