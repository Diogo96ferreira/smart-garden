import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { parseActionKey, type Locale } from '@/lib/nameMatching';
import type { Row } from '@/app/api/report/route';

export async function generatePdf({
  locale,
  rangeDays,
  unique,
  filename,
}: {
  locale: Locale;
  rangeDays: number;
  unique: Row[];
  filename: string;
}): Promise<any> {
  // Colors used in original PDF generation
  const COLOR = {
    primary: '#22c55e',
    text: '#111111',
    muted: '#6b7280',
    border: '#e5e7eb',
    chip: {
      water: '#10b981',
      prune: '#ef4444',
      fertilize: '#f59e0b',
      inspect: '#64748b',
      harvest: '#16a34a',
      sow: '#8b5cf6',
      transplant: '#0ea5e9',
      other: '#6b7280',
    },
  } as const;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-PT', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });

  const styles = StyleSheet.create({
    page: { padding: 42, fontFamily: 'Helvetica' },
    header: { marginBottom: 12 },
    title: { fontSize: 18, fontWeight: 'bold', color: COLOR.primary },
    subTitle: { fontSize: 10, color: COLOR.muted },
    legend: { flexDirection: 'row', marginBottom: 10 },
    chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
    chipLabel: { fontSize: 9, color: '#fff' },
    row: { marginBottom: 8 },
    date: { fontSize: 12, fontWeight: 'bold', color: COLOR.primary },
    actionChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 6 },
    actionText: { fontSize: 8, color: '#fff' },
    rowTitle: { fontSize: 11, color: COLOR.text },
    rowDesc: { fontSize: 9, color: COLOR.muted },
    footer: { fontSize: 8, color: COLOR.muted, textAlign: 'center', marginTop: 20 },
  });

  const MyDocument = ({
    locale,
    rangeDays,
    unique,
  }: {
    locale: Locale;
    rangeDays: number;
    unique: Row[];
  }) => (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {locale === 'en' ? 'Smart Garden - Care Plan' : 'Smart Garden - Plano de cuidados'}
          </Text>
          <Text style={styles.subTitle}>
            {`${new Date().toLocaleString(locale === 'en' ? 'en-US' : 'pt-PT')} | ${rangeDays} ${
              locale === 'en' ? 'days' : 'dias'
            }`}
          </Text>
        </View>
        {/* Legend */}
        <View style={styles.legend}>
          {Object.entries(COLOR.chip).map(([key, color]) => (
            <View key={key} style={[styles.chip, { backgroundColor: color }]}>
              <Text style={styles.chipLabel}> {key} </Text>
            </View>
          ))}
        </View>
        {/* Rows */}
        {unique.map((r, i) => {
          const action = (parseActionKey(r.title, locale) as keyof typeof COLOR.chip) || 'other';
          return (
            <View key={i} style={styles.row}>
              <Text style={styles.date}> {fmtDate(r.date)} </Text>
              <View style={[styles.actionChip, { backgroundColor: COLOR.chip[action] }]}>
                <Text style={styles.actionText}> {action.toUpperCase()} </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}> {r.title} </Text>
                {r.description && <Text style={styles.rowDesc}> {r.description} </Text>}
              </View>
            </View>
          );
        })}
        {/* Footer */}
        <Text style={styles.footer}>
          {`${rangeDays} ${locale === 'en' ? 'days' : 'dias'} | Page `}
        </Text>
      </Page>
    </Document>
  );

  const buffer = await pdf(
    <MyDocument locale={locale} rangeDays={rangeDays} unique={unique} />,
  ).toBuffer();
  return buffer;
}
