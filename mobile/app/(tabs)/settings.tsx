import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Card, ErrorBanner, Row, SectionTitle } from '@/components/ui';
import { api, ApiRequestError } from '@/lib/api';
import { useApiConfig } from '@/lib/apiConfig';

export default function SettingsScreen() {
  const { baseUrl, setBaseUrl } = useApiConfig();
  const [draft, setDraft] = useState(baseUrl);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    await setBaseUrl(draft);
    setResult(null);
    setError(null);
  }

  async function testConnection() {
    setTesting(true);
    setResult(null);
    setError(null);
    try {
      const health = await api.health(draft.trim().replace(/\/+$/, ''));
      setResult(`Connected. Live trading ${health.liveTrading ? 'available' : 'not configured'} on the server.`);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Connection failed');
    } finally {
      setTesting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <SectionTitle>Server address</SectionTitle>
        <Text style={styles.helper}>
          Point this at the computer running `npm run dev:server`. On the phone this can never be
          "localhost" — it must be your computer's LAN IP (or a Tailscale address once you set that up),
          both devices on the same network.
        </Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="http://192.168.1.23:8787"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={styles.input}
        />
        <View style={styles.buttonRow}>
          <Pressable style={[styles.button, styles.secondaryButton]} onPress={testConnection} disabled={testing}>
            {testing ? <ActivityIndicator /> : <Text style={styles.secondaryButtonText}>Test connection</Text>}
          </Pressable>
          <Pressable style={styles.button} onPress={save}>
            <Text style={styles.buttonText}>Save</Text>
          </Pressable>
        </View>
        {result ? <Text style={styles.success}>{result}</Text> : null}
        {error ? <ErrorBanner message={error} /> : null}
      </Card>

      <Card>
        <SectionTitle>Finding your computer's IP</SectionTitle>
        <Text style={styles.helper}>
          Mac: System Settings → Wi‑Fi → Details, look for "IP Address".{'\n'}
          Windows: open Command Prompt, run `ipconfig`, use "IPv4 Address".{'\n'}
          Then make sure the server was started with the server actually listening on that network
          (the default `npm run dev:server` already binds to all interfaces).
        </Text>
      </Card>

      <Card>
        <SectionTitle>Currently saved</SectionTitle>
        <Row label="Base URL" value={baseUrl} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  helper: { opacity: 0.7, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.4)',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  buttonRow: { flexDirection: 'row', gap: 10 },
  button: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '700' },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#2563eb' },
  secondaryButtonText: { color: '#2563eb', fontWeight: '700' },
  success: { color: '#16a34a', marginTop: 10 },
});
