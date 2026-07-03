import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { REMOTE_MODEL_OPTIONS } from '../src/constants/config';
import { getPersonalContext, setPersonalContext } from '../src/db/personalContext';
import { useConnectivity } from '../src/hooks/useConnectivity';
import { useSettings } from '../src/settings/SettingsContext';

export default function SettingsScreen() {
  const { apiKey, routerThreshold, remoteModel, setApiKey, setRouterThreshold, setRemoteModel } =
    useSettings();
  const isOnline = useConnectivity();

  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [thresholdDraft, setThresholdDraft] = useState(String(routerThreshold));
  const [contextDraft, setContextDraft] = useState('');
  const [forceLocal, setForceLocal] = useState(false);
  const [isSavingContext, setIsSavingContext] = useState(false);

  useEffect(() => {
    setApiKeyDraft(apiKey ?? '');
  }, [apiKey]);

  useEffect(() => {
    setThresholdDraft(String(routerThreshold));
  }, [routerThreshold]);

  useEffect(() => {
    (async () => {
      const stored = await getPersonalContext();
      setContextDraft(stored);
    })();
  }, []);

  const handleSaveApiKey = async () => {
    await setApiKey(apiKeyDraft);
    Alert.alert('Guardado', 'API key actualizada.');
  };

  const handleSaveThreshold = async () => {
    const parsed = Number(thresholdDraft);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert('Valor inválido', 'Introduce un número de caracteres mayor que 0.');
      return;
    }
    await setRouterThreshold(Math.round(parsed));
    Alert.alert('Guardado', 'Umbral del router actualizado.');
  };

  const handleSaveContext = async () => {
    setIsSavingContext(true);
    try {
      await setPersonalContext(contextDraft);
      Alert.alert('Guardado', 'Contexto personal actualizado.');
    } finally {
      setIsSavingContext(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Section title="Conectividad">
          <Text style={styles.statusText}>
            {isOnline ? '🟢 En línea' : '🔴 Sin conexión'} — {isOnline ? 'la app puede usar Claude API' : 'forzando modo local'}
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Forzar solo modelo local</Text>
            <Switch value={forceLocal} onValueChange={setForceLocal} disabled />
          </View>
          <Text style={styles.helperText}>
            (Próximamente: forzar modo local manualmente. Por ahora se activa automáticamente sin
            conexión.)
          </Text>
        </Section>

        <Section title="API key de Anthropic">
          <TextInput
            style={styles.input}
            value={apiKeyDraft}
            onChangeText={setApiKeyDraft}
            placeholder="sk-ant-..."
            placeholderTextColor="#71717a"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <Pressable style={styles.saveButton} onPress={handleSaveApiKey}>
            <Text style={styles.saveButtonText}>Guardar API key</Text>
          </Pressable>
          <Text style={styles.helperText}>
            Se guarda cifrada en el almacén seguro del dispositivo (Keychain / Keystore), nunca en
            texto plano.
          </Text>
        </Section>

        <Section title="Modelo remoto (Claude)">
          {REMOTE_MODEL_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={[styles.modelChip, remoteModel === option.id && styles.modelChipSelected]}
              onPress={() => setRemoteModel(option.id)}
            >
              <Text
                style={[
                  styles.modelChipText,
                  remoteModel === option.id && styles.modelChipTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </Section>

        <Section title="Umbral del router">
          <Text style={styles.helperText}>
            Mensajes por debajo de este número de caracteres (sin código ni palabras clave de
            análisis) se resuelven con el modelo local. Por encima, se envían a Claude.
          </Text>
          <TextInput
            style={styles.input}
            value={thresholdDraft}
            onChangeText={setThresholdDraft}
            keyboardType="number-pad"
            placeholder="280"
          />
          <Pressable style={styles.saveButton} onPress={handleSaveThreshold}>
            <Text style={styles.saveButtonText}>Guardar umbral</Text>
          </Pressable>
        </Section>

        <Section title="Contexto personal">
          <Text style={styles.helperText}>
            Este texto se inyecta como parte del system prompt en ambos modelos (local y Claude).
            Úsalo para contarle a la IA quién eres, tus preferencias, tono, etc.
          </Text>
          <TextInput
            style={styles.textArea}
            value={contextDraft}
            onChangeText={setContextDraft}
            placeholder="Ej: Me llamo Stefan, soy desarrollador, prefiero respuestas directas y en español..."
            placeholderTextColor="#71717a"
            multiline
            numberOfLines={6}
          />
          <Pressable style={styles.saveButton} onPress={handleSaveContext} disabled={isSavingContext}>
            <Text style={styles.saveButtonText}>
              {isSavingContext ? 'Guardando...' : 'Guardar contexto'}
            </Text>
          </Pressable>
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 20 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', color: '#71717a' },
  statusText: { fontSize: 15, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 15 },
  helperText: { fontSize: 12, color: '#71717a', lineHeight: 17 },
  input: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: 'white', fontWeight: '600' },
  modelChip: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  modelChipSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  modelChipText: { fontSize: 14, color: '#111827' },
  modelChipTextSelected: { color: '#2563eb', fontWeight: '600' },
});
