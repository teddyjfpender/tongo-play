import React from 'react';
import { StyleSheet, View } from 'react-native';
import ActionButton from './action-button';

type Action = {
  key: string;
  icon: any;
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function ActionRow({ actions }: { actions: Action[] }) {
  return (
    <View style={styles.row}>
      {actions.map((a) => (
        <ActionButton key={a.key} icon={a.icon} label={a.label} onPress={a.onPress} disabled={a.disabled} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

