import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ProgressButton } from '@/components/progress-button';

type OperationCardProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function OperationCard({
  title,
  description,
  actionLabel,
  onAction,
  loading,
  disabled,
  children,
  style,
}: OperationCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      <View style={styles.content}>{children}</View>
      {actionLabel && onAction ? (
        <View style={styles.actionRow}>
          <ProgressButton title={actionLabel} isLoading={!!loading} disabled={disabled} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    padding: 12,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  desc: {
    color: '#666',
  },
  content: {
    gap: 8,
  },
  actionRow: {
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});

