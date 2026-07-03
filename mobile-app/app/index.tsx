import { Link, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHybridChat } from '../src/ai/useHybridChat';
import { ChatComposer } from '../src/components/ChatComposer';
import { ConnectivityBanner } from '../src/components/ConnectivityBanner';
import { MessageBubble } from '../src/components/MessageBubble';

export default function ChatScreen() {
  const {
    messages,
    isHistoryLoaded,
    isSending,
    isOnline,
    lastDecision,
    sendMessage,
    localModel,
    refreshPersonalContext,
  } = useHybridChat();
  const listRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  // Personal context may have been edited in Settings — reload it whenever
  // this screen regains focus so it's reflected in the next system prompt.
  useFocusEffect(
    useCallback(() => {
      refreshPersonalContext();
    }, [refreshPersonalContext])
  );

  const isModelDownloading = !localModel.isReady && !localModel.error;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable hitSlop={12}>
                <Text style={styles.settingsIcon}>⚙️</Text>
              </Pressable>
            </Link>
          ),
        }}
      />

      <ConnectivityBanner isOnline={isOnline} />

      {isModelDownloading && (
        <View style={styles.downloadBanner}>
          <Text style={styles.downloadText}>
            Descargando modelo local (Llama 3.2 3B)… {Math.round(localModel.downloadProgress * 100)}%
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            isHistoryLoaded ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Escribe algo para empezar. Los mensajes cortos se responden con el modelo
                  local; los análisis largos o con código se envían a Claude.
                </Text>
              </View>
            ) : null
          }
        />

        {lastDecision && (
          <Text style={styles.decisionHint}>Última decisión del router: {lastDecision.reason}</Text>
        )}

        <ChatComposer onSend={sendMessage} isSending={isSending} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  settingsIcon: { fontSize: 20 },
  downloadBanner: {
    backgroundColor: '#4f46e5',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  downloadText: { color: 'white', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  listContent: { paddingVertical: 12, flexGrow: 1 },
  emptyState: { padding: 24, alignItems: 'center' },
  emptyStateText: { textAlign: 'center', color: '#71717a', fontSize: 14, lineHeight: 20 },
  decisionHint: {
    fontSize: 11,
    color: '#a1a1aa',
    textAlign: 'center',
    paddingBottom: 4,
  },
});
