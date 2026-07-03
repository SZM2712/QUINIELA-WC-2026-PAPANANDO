import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { ChatMessage } from '../ai/types';
import { ModelBadge } from './ModelBadge';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View
        style={[
          styles.bubble,
          isUser
            ? styles.userBubble
            : isDark
              ? styles.assistantBubbleDark
              : styles.assistantBubbleLight,
        ]}
      >
        {!isUser && <ModelBadge model={message.modelUsed} />}
        <Text
          style={
            isUser ? styles.userText : isDark ? styles.assistantTextDark : styles.assistantTextLight
          }
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 12, marginVertical: 4 },
  rowUser: { justifyContent: 'flex-end' },
  rowAssistant: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  assistantBubbleLight: { backgroundColor: '#e5e7eb', borderBottomLeftRadius: 4 },
  assistantBubbleDark: { backgroundColor: '#27272a', borderBottomLeftRadius: 4 },
  userText: { color: '#ffffff', fontSize: 15, lineHeight: 20 },
  assistantTextLight: { color: '#111827', fontSize: 15, lineHeight: 20 },
  assistantTextDark: { color: '#f4f4f5', fontSize: 15, lineHeight: 20 },
});
