import { StyleSheet, View } from 'react-native';
import { Text, View as ThemedView, ViewProps as ThemedViewProps } from '@/components/Themed';

export function Card({ children, style, ...rest }: ThemedViewProps) {
  return (
    <ThemedView style={[styles.card, style]} {...rest}>
      {children}
    </ThemedView>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const SIGNAL_COLORS: Record<string, string> = {
  BULLISH: '#16a34a',
  BEARISH: '#dc2626',
  NEUTRAL: '#6b7280',
  WAIT: '#9ca3af',
};

export function SignalBadge({ signal }: { signal: string }) {
  const color = SIGNAL_COLORS[signal] ?? '#6b7280';
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{signal}</Text>
    </View>
  );
}

const STATUS_COLORS: Record<string, string> = {
  RUNNING: '#16a34a',
  PAUSED: '#d97706',
  DAILY_LIMIT: '#dc2626',
};

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#6b7280';
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{status.replace('_', ' ')}</Text>
    </View>
  );
}

export function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.25)',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: {
    opacity: 0.6,
  },
  rowValue: {
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#dc262622',
    borderColor: '#dc2626',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
  },
});
