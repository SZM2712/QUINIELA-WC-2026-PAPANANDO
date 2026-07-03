import { StyleSheet, Text, View } from 'react-native';

import { ModelSource } from '../ai/types';

export function ModelBadge({ model }: { model: ModelSource | null }) {
  if (!model) return null;
  const isLocal = model === 'local';
  return (
    <View style={[styles.badge, isLocal ? styles.local : styles.remote]}>
      <Text style={styles.text}>{isLocal ? '📱 Local · Llama 3.2' : '☁️ Claude API'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  local: { backgroundColor: '#4f46e5' },
  remote: { backgroundColor: '#0891b2' },
  text: { color: 'white', fontSize: 11, fontWeight: '600' },
});
