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
  const COLOR = {
    primary: '#166534', // Green 800 - mais escuro e profissional
    secondary: '#22c55e', // Green 500
    text: '#1f2937', // Gray 800
    muted: '#6b7280', // Gray 500
    border: '#e5e7eb', // Gray 200
    bg: '#f9fafb', // Gray 50
    chip: {
      water: '#0ea5e9', // Sky 500 (água azul)
      prune: '#ef4444', // Red 500
      fertilize: '#f59e0b', // Amber 500
      inspect: '#8b5cf6', // Violet 500
      harvest: '#16a34a', // Green 600
      sow: '#84cc16', // Lime 500
      transplant: '#06b6d4', // Cyan 500
      other: '#9ca3af', // Gray 400
    },
  } as const;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  const styles = StyleSheet.create({
    page: {
      paddingTop: 35,
      paddingBottom: 65,
      paddingHorizontal: 35,
      fontFamily: 'Helvetica',
      fontSize: 10,
      color: COLOR.text,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: COLOR.primary,
      paddingBottom: 10,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: COLOR.primary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    headerSubtitle: {
      fontSize: 10,
      color: COLOR.muted,
    },
    legendContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 25,
      padding: 10,
      backgroundColor: COLOR.bg,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: COLOR.border,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 12,
      marginBottom: 4,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 4,
    },
    legendText: {
      fontSize: 8,
      color: COLOR.muted,
      textTransform: 'capitalize',
    },
    daySection: {
      marginBottom: 15,
    },
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      backgroundColor: '#f0fdf4', // Green 50
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
    },
    dayTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: COLOR.primary,
      textTransform: 'capitalize',
    },
    taskRow: {
      flexDirection: 'row',
      marginBottom: 8,
      paddingLeft: 12,
      alignItems: 'flex-start',
    },
    actionBadge: {
      width: 70,
      paddingVertical: 3,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    actionText: {
      color: '#ffffff',
      fontSize: 7,
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    taskContent: {
      flex: 1,
    },
    taskTitle: {
      fontSize: 10,
      fontWeight: 'bold',
      color: COLOR.text,
      marginBottom: 2,
    },
    taskDesc: {
      fontSize: 9,
      color: COLOR.muted,
      lineHeight: 1.3,
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 35,
      right: 35,
      textAlign: 'center',
      color: COLOR.muted,
      fontSize: 8,
      borderTopWidth: 1,
      borderTopColor: COLOR.border,
      paddingTop: 10,
    },
  });

  // Group rows by date
  const groupedRows: Record<string, Row[]> = {};
  unique.forEach((row) => {
    if (!groupedRows[row.date]) {
      groupedRows[row.date] = [];
    }
    groupedRows[row.date].push(row);
  });

  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.headerTitle}>Smart Garden</Text>
            <Text style={{ fontSize: 12, color: COLOR.secondary, marginTop: 2 }}>
              {locale === 'en' ? 'Care Plan' : 'Plano de Cuidados'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.headerSubtitle}>
              {new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-PT')}
            </Text>
            <Text style={styles.headerSubtitle}>
              {rangeDays} {locale === 'en' ? 'days' : 'dias'}
            </Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          {Object.entries(COLOR.chip).map(([key, color]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{key}</Text>
            </View>
          ))}
        </View>

        {/* Tasks Grouped by Date */}
        {Object.entries(groupedRows).map(([date, tasks]) => (
          <View key={date} style={styles.daySection} wrap={false}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{fmtDate(date)}</Text>
            </View>
            {tasks.map((task, i) => {
              const action =
                (parseActionKey(task.title, locale) as keyof typeof COLOR.chip) || 'other';
              return (
                <View key={i} style={styles.taskRow}>
                  <View style={[styles.actionBadge, { backgroundColor: COLOR.chip[action] }]}>
                    <Text style={styles.actionText}>{action}</Text>
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    {task.description && <Text style={styles.taskDesc}>{task.description}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${locale === 'en' ? 'Page' : 'Página'} ${pageNumber} / ${totalPages} | Smart Garden App`
          }
          fixed
        />
      </Page>
    </Document>
  );

  const buffer = await pdf(<MyDocument />).toBuffer();
  return buffer;
}
