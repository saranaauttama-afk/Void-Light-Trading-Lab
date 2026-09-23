import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Card, ErrorBanner, Row, SectionTitle, StatusBadge } from '@/components/ui';
import { api, ApiRequestError } from '@/lib/api';
import { useApiConfig } from '@/lib/apiConfig';
import { usePoll } from '@/lib/usePoll';
import type { Side } from '@/lib/types';

export default function PaperScreen() {
  const { baseUrl } = useApiConfig();
  const state = usePoll(() => api.state(baseUrl), [baseUrl], 8000);
  const [notional, setNotional] = useState('10');
  const [submitting, setSubmitting] = useState<Side | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function toggleSession(action: 'start' | 'pause') {
    try {
      await api.session(baseUrl, action);
      state.refresh();
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : 'Failed to update session');
    }
  }

  async function placeOrder(side: Side) {
    const amount = Number(notional);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid amount', 'Enter a notional greater than 0.');
      return;
    }
    setSubmitting(side);
    setActionError(null);
    try {
      const res = await api.paperOrder(baseUrl, side, amount);
      Alert.alert('Order filled', res.result.message);
      state.refresh();
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : 'Order failed');
    } finally {
      setSubmitting(null);
    }
  }

  const s = state.data;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={state.loading} onRefresh={state.refresh} />}>
      {state.error ? <ErrorBanner message={state.error} /> : null}
      {actionError ? <ErrorBanner message={actionError} /> : null}

      {s ? (
        <>
          <Card>
            <View style={styles.headerRow}>
              <SectionTitle>Session</SectionTitle>
              <StatusBadge status={s.status} />
            </View>
            <Text style={styles.equity}>${s.equity.toFixed(2)}</Text>
            <Text style={[styles.pnl, { color: s.dailyPnl >= 0 ? '#16a34a' : '#dc2626' }]}>
              {s.dailyPnl >= 0 ? '+' : ''}
              {s.dailyPnl.toFixed(2)} ({s.dailyPnlPct.toFixed(2)}%) today
            </Text>
            <Row label="Cash" value={`$${s.cash.toFixed(2)}`} />
            <Row label="Asset" value={s.asset.toFixed(6)} />
            <Row label="Trades today" value={`${s.dailyTradeCount} / ${s.risk.maxTradesPerDay}`} />
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.smallButton, s.status === 'RUNNING' && styles.smallButtonDisabled]}
                disabled={s.status === 'RUNNING'}
                onPress={() => toggleSession('start')}>
                <Text style={styles.smallButtonText}>Start</Text>
              </Pressable>
              <Pressable
                style={[styles.smallButton, styles.pauseButton, s.status === 'PAUSED' && styles.smallButtonDisabled]}
                disabled={s.status === 'PAUSED'}
                onPress={() => toggleSession('pause')}>
                <Text style={styles.smallButtonText}>Pause</Text>
              </Pressable>
            </View>
          </Card>

          <Card>
            <SectionTitle>Manual order (paper)</SectionTitle>
            <TextInput
              value={notional}
              onChangeText={setNotional}
              keyboardType="decimal-pad"
              placeholder="Notional in USDT"
              style={styles.input}
            />
            <View style={styles.buttonRow}>
              <Pressable style={[styles.orderButton, styles.buyButton]} onPress={() => placeOrder('BUY')} disabled={!!submitting}>
                {submitting === 'BUY' ? <ActivityIndicator color="white" /> : <Text style={styles.orderButtonText}>Buy</Text>}
              </Pressable>
              <Pressable style={[styles.orderButton, styles.sellButton]} onPress={() => placeOrder('SELL')} disabled={!!submitting}>
                {submitting === 'SELL' ? <ActivityIndicator color="white" /> : <Text style={styles.orderButtonText}>Sell</Text>}
              </Pressable>
            </View>
          </Card>

          <Card>
            <SectionTitle>Recent trades</SectionTitle>
            {s.trades.length === 0 ? (
              <Text style={styles.empty}>No paper trades yet.</Text>
            ) : (
              s.trades.slice(0, 15).map((t) => (
                <View key={t.id} style={styles.tradeRow}>
                  <Text style={[styles.tradeSide, { color: t.side === 'BUY' ? '#16a34a' : '#dc2626' }]}>{t.side}</Text>
                  <Text style={styles.tradeDetail}>
                    {t.quantity.toFixed(6)} @ {t.price.toFixed(2)}
                  </Text>
                  <Text style={styles.tradeTime}>{new Date(t.createdAt).toLocaleTimeString()}</Text>
                </View>
              ))
            )}
          </Card>
        </>
      ) : state.loading ? (
        <ActivityIndicator style={{ marginVertical: 20 }} />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  equity: { fontSize: 30, fontWeight: '800', marginTop: 4 },
  pnl: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  smallButton: { flex: 1, backgroundColor: '#16a34a', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  pauseButton: { backgroundColor: '#d97706' },
  smallButtonDisabled: { opacity: 0.35 },
  smallButtonText: { color: 'white', fontWeight: '700' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.4)',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  orderButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  buyButton: { backgroundColor: '#16a34a' },
  sellButton: { backgroundColor: '#dc2626' },
  orderButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  empty: { opacity: 0.5, fontStyle: 'italic' },
  tradeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, alignItems: 'center' },
  tradeSide: { fontWeight: '700', width: 44 },
  tradeDetail: { flex: 1, opacity: 0.8 },
  tradeTime: { opacity: 0.5, fontSize: 12 },
});
