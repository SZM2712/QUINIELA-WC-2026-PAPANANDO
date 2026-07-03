import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

export function ChatComposer({
  onSend,
  isSending,
}: {
  onSend: (text: string) => void;
  isSending: boolean;
}) {
  const [text, setText] = useState('');
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const handleSend = () => {
    if (!text.trim() || isSending) return;
    onSend(text);
    setText('');
  };

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <TextInput
        style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
        value={text}
        onChangeText={setText}
        placeholder="Escribe un mensaje..."
        placeholderTextColor={isDark ? '#a1a1aa' : '#71717a'}
        multiline
        editable={!isSending}
      />
      <Pressable
        style={[styles.sendButton, (!text.trim() || isSending) && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!text.trim() || isSending}
      >
        {isSending ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.sendButtonText}>Enviar</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  containerLight: { backgroundColor: '#ffffff', borderTopColor: '#d4d4d8' },
  containerDark: { backgroundColor: '#18181b', borderTopColor: '#3f3f46' },
  input: {
    flex: 1,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputLight: { backgroundColor: '#f4f4f5', color: '#111827' },
  inputDark: { backgroundColor: '#27272a', color: '#f4f4f5' },
  sendButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: 'white', fontWeight: '600' },
});
