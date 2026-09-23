import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Card, ErrorBanner, Row, SectionTitle } from '@/components/ui';
import { api, ApiRequestError } from '@/lib/api';
import { useApiConfig } from '@/lib/apiConfig';
import { usePoll } from '@/lib/usePoll';
import type { Side } from '@/lib/types';

export default function LiveScreen() {
  const { baseUrl } = useApiConfig();
  const capabilities = usePoll(() => api.capabilities(baseUrl), [baseUrl], 20000);
  const state = usePoll(() => api.state(baseUrl), [baseUrl], 15000);

  const [notional, setNotional] = useState('10');
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState<Side | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const account = usePoll(
    () => (capabilities.data?.live.available ? api.liveAccount(baseUrl) : Promise.resolve(null)),
    [baseUrl, capabilities.data?.live.available],
    20000,
  );

  const available = capabilities.data?.live.available ?? false;
  const network = capabilities.data?.live.network;

  function requestOrder(side: Side) {
    const amount = Number(notional);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid amount', 'Enter a notional greater than 0.');
      return;
    }
    if (confirmText.trim().toUpperCase() !== 'CONFIRM') {
      Alert.alert('Type CONFIRM first', 'This places a REAL order. Type CONFIRM in the box below to arm it.');
      return;
    }
    Alert.alert(
      `Real ${side} order`,
      `This sends a REAL ${network ?? ''} market order for ~$${amount} on ${network === 'MAINNET' ? 'MAINNET — real money' : 'TESTNET'}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: `Yes, ${side}`, style: 'destructive', onPress: () => submitOrder(side, amount) },
      ],
    );
  }

  async function submitOrder(side: Side, amount: number) {
    setSubmitting(side);
    setActionError(null);
    try {
      const res = await api.liveOrder(baseUrl, side, amount);
      Alert.alert('Live order result', res.result.message);
      setConfirmText('');
      state.refresh();
      account.refresh();
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : 'Live order failed');
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={capabilities.loading || state.loading}
          onRefresh={() => {
            capabilities.refresh();
            state.refresh();
            account.refresh();
          }}
        />
      }>
      <Card style={styles.warningCard}>
        <Text style={styles.warningText}>
          This places REAL orders on Binance {network ? `(${network})` : ''}. It is not simulated — money
          actually moves.
        </Text>
      </Card>

      {capabilities.error ? <ErrorBanner message={capabilities.error} /> : null}

      <Card>
        <SectionTitle>Status</SectionTitle>
        <Row label="Available" value={available ? 'Yes' : 'No'} />
        <Row label="Network" value={network ?? '—'} />
        {!available ? (
          <Text style={styles.helper}>
            Not configured on the server. Set LIVE_TRADING_ENABLED, BINANCE_API_KEY and
            BINANCE_API_SECRET in the server's .env, then restart it.
          </Text>
        ) : null}
      </Card>

      {available && account.data ? (
        <Card>
          <SectionTitle>Balances ({account.data.network})</SectionTitle>
          {account.data.balances.length === 0 ? (
            <Text style={styles.helper}>No non-zero balances.</Text>
          ) : (
            account.data.balances.map((b) => <Row key={b.asset} label={b.asset} value={b.free.toFixed(6)} />)
          )}
        </Card>
      ) : null}

      {available ? (
        <Card>
          <SectionTitle>Place real order</SectionTitle>
          <TextInput
            value={notional}
            onChangeText={setNotional}
            keyboardType="decimal-pad"
            placeholder="Notional in USDT"
            style={styles.input}
          />
          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder='Type "CONFIRM" to arm the buttons'
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.input}
          />
          {actionError ? <ErrorBanner message={actionError} /> : null}
          <View style={styles.buttonRow}>
            <Pressable style={[styles.orderButton, styles.buyButton]} onPress={() => requestOrder('BUY')} disabled={!!submitting}>
              {submitting === 'BUY' ? <ActivityIndicator color="white" /> : <Text style={styles.orderButtonText}>Buy</Text>}
            </Pressable>
            <Pressable style={[styles.orderButton, styles.sellButton]} onPress={() => requestOrder('SELL')} disabled={!!submitting}>
              {submitting === 'SELL' ? <ActivityIndicator color="white" /> : <Text style={styles.orderButtonText}>Sell</Text>}
            </Pressable>
          </View>
        </Card>
      ) : null}

      {state.data ? (
        <Card>
          <SectionTitle>Recent live fills</SectionTitle>
          {state.data.liveTrades.length === 0 ? (
            <Text style={styles.helper}>No live orders yet.</Text>
          ) : (
            state.data.liveTrades.slice(0, 15).map((t) => (
              <View key={t.id} style={styles.tradeRow}>
                <Text style={[styles.tradeSide, { color: t.side === 'BUY' ? '#16a34a' : '#dc2626' }]}>{t.side}</Text>
                <Text style={styles.tradeDetail}>
                  {t.executedQty.toFixed(6)} @ {t.avgPrice.toFixed(2)} · {t.status}
                </Text>
                <Text style={styles.tradeTime}>{new Date(t.createdAt).toLocaleTimeString()}</Text>
              </View>
            ))
          )}
        </Card>
      ) : capabilities.loading ? (
        <ActivityIndicator style={{ marginVertical: 20 }} />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  warningCard: { backgroundColor: '#dc262615', borderColor: '#dc2626' },
  warningText: { color: '#dc2626', fontWeight: '700', fontSize: 13, lineHeight: 18 },
  helper: { opacity: 0.6, fontSize: 13, lineHeight: 18, marginTop: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.4)',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  buttonRow: { flexDirection: 'row', gap: 10 },
  orderButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  buyButton: { backgroundColor: '#16a34a' },
  sellButton: { backgroundColor: '#dc2626' },
  orderButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  tradeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, alignItems: 'center' },
  tradeSide: { fontWeight: '700', width: 44 },
  tradeDetail: { flex: 1, opacity: 0.8 },
  tradeTime: { opacity: 0.5, fontSize: 12 },
});
