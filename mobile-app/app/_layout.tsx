import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

import { SettingsProvider } from '../src/settings/SettingsContext';

initExecutorch({ resourceFetcher: ExpoResourceFetcher });

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <Stack>
            <Stack.Screen name="index" options={{ title: 'Hybrid AI Chat' }} />
            <Stack.Screen
              name="settings"
              options={{ title: 'Ajustes', presentation: 'modal' }}
            />
          </Stack>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
