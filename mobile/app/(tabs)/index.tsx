import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Card, ErrorBanner, Row, SectionTitle, SignalBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { useApiConfig } from '@/lib/apiConfig';
import { usePoll } from '@/lib/usePoll';

export default function MarketScreen() {
  const { baseUrl } = useApiConfig();
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [symbolDraft, setSymbolDraft] = useState('BTCUSDT');

  const market = usePoll(() => api.market(baseUrl, symbol), [baseUrl, symbol], 10000);
  const analysis = usePoll(() => api.multiAnalysis(baseUrl, symbol), [baseUrl, symbol], 15000);

  const refreshAll = useCallback(() => {
    market.refresh();
    analysis.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market.refresh, analysis.refresh]);

  const refreshing = market.loading || analysis.loading;
  const error = market.error ?? analysis.error;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}>
      <Card>
        <SectionTitle>Symbol</SectionTitle>
        <View style={styles.symbolRow}>
          <TextInput
            value={symbolDraft}
            onChangeText={(t) => setSymbolDraft(t.toUpperCase())}
            onSubmitEditing={() => setSymbol(symbolDraft.trim() || 'BTCUSDT')}
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.input}
            placeholder="BTCUSDT"
          />
        </View>
      </Card>

      {error ? <ErrorBanner message={error} /> : null}

      {market.data ? (
        <Card>
          <SectionTitle>{market.data.symbol}</SectionTitle>
          <Text style={styles.price}>{market.data.price.toLocaleString()}</Text>
          <Text style={[styles.change, { color: market.data.changePct >= 0 ? '#16a34a' : '#dc2626' }]}>
            {market.data.changePct >= 0 ? '+' : ''}
            {market.data.changePct.toFixed(2)}% (24h)
          </Text>
          <Row label="24h High" value={market.data.high.toLocaleString()} />
          <Row label="24h Low" value={market.data.low.toLocaleString()} />
          <Row label="24h Volume" value={market.data.volume.toLocaleString()} />
        </Card>
      ) : market.loading ? (
        <ActivityIndicator style={{ marginVertical: 20 }} />
      ) : null}

      {analysis.data?.map((a) => (
        <Card key={a.interval}>
          <View style={styles.analysisHeader}>
            <SectionTitle>{a.interval}</SectionTitle>
            <SignalBadge signal={a.signal} />
          </View>
          <Row label="EMA9 / EMA21" value={`${a.fast.toFixed(2)} / ${a.slow.toFixed(2)}`} />
          <Row label="RSI" value={a.rsi.toFixed(1)} />
          <Row label="ATR" value={a.atr.toFixed(2)} />
          <Row label="Volume ratio" value={`${a.volumeRatio.toFixed(2)}x`} />
          <Text style={styles.reason}>{a.reason}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  symbolRow: { flexDirection: 'row' },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.4)',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    letterSpacing: 1,
  },
  price: { fontSize: 30, fontWeight: '800', marginBottom: 2 },
  change: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  analysisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reason: { marginTop: 8, fontSize: 12, opacity: 0.6, lineHeight: 17 },
});
