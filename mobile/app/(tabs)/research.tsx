import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Card, ErrorBanner, Row, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { useApiConfig } from '@/lib/apiConfig';
import { usePoll } from '@/lib/usePoll';

export default function ResearchScreen() {
  const { baseUrl } = useApiConfig();
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [symbolDraft, setSymbolDraft] = useState('BTCUSDT');

  const research = usePoll(() => api.research(baseUrl, symbol), [baseUrl, symbol], 60000);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={research.loading} onRefresh={research.refresh} />}>
      <Card>
        <SectionTitle>Symbol</SectionTitle>
        <TextInput
          value={symbolDraft}
          onChangeText={(t) => setSymbolDraft(t.toUpperCase())}
          onSubmitEditing={() => setSymbol(symbolDraft.trim() || 'BTCUSDT')}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
          placeholder="BTCUSDT"
        />
        <Text style={styles.helper}>
          Runs a backtest + 70/30 out-of-sample walk-forward on 15m, 1h and 4h candles. This can take a
          few seconds — it's pulling 800 candles per timeframe from Binance.
        </Text>
      </Card>

      {research.error ? <ErrorBanner message={research.error} /> : null}
      {research.loading && !research.data ? <ActivityIndicator style={{ marginVertical: 20 }} /> : null}

      {research.data?.map((r) => (
        <Card key={r.interval}>
          <SectionTitle>{r.interval} backtest</SectionTitle>
          <Row
            label="Return"
            value={`${r.backtest.returnPct.toFixed(2)}%`}
            valueColor={r.backtest.returnPct >= 0 ? '#16a34a' : '#dc2626'}
          />
          <Row label="Buy & hold" value={`${r.backtest.buyHoldPct.toFixed(2)}%`} />
          <Row
            label="Alpha"
            value={`${r.backtest.alphaPct.toFixed(2)}%`}
            valueColor={r.backtest.alphaPct >= 0 ? '#16a34a' : '#dc2626'}
          />
          <Row label="Max drawdown" value={`${r.backtest.maxDrawdownPct.toFixed(2)}%`} />
          <Row label="Trades" value={String(r.backtest.trades)} />

          <View style={styles.divider} />

          <SectionTitle>Out-of-sample ({r.walkForward.splitPct}/{100 - r.walkForward.splitPct} split)</SectionTitle>
          <Row
            label="OOS return"
            value={`${r.walkForward.outOfSample.returnPct.toFixed(2)}%`}
            valueColor={r.walkForward.outOfSample.returnPct >= 0 ? '#16a34a' : '#dc2626'}
          />
          <Row label="OOS max drawdown" value={`${r.walkForward.outOfSample.maxDrawdownPct.toFixed(2)}%`} />
          <Row label="OOS alpha" value={`${r.walkForward.outOfSample.alphaPct.toFixed(2)}%`} />
          <Row
            label="Passed"
            value={r.walkForward.passed ? 'Yes' : 'No'}
            valueColor={r.walkForward.passed ? '#16a34a' : '#dc2626'}
          />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.4)',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 10,
  },
  helper: { opacity: 0.6, fontSize: 12, lineHeight: 17 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.3)', marginVertical: 10 },
});
