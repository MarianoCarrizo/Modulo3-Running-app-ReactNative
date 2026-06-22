import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../../navigation';
import { colors, fontSizes, spacing, radii } from '../../../core/theme';
import { CenteredLoader } from '../../../core/components';
import { Run } from '../../../core/types';
import { RunRepository } from '../../run/data/RunRepository';
import { useAuthStore } from '../../../core/store/auth.store';
import { useRunStore } from '../../../core/store/run.store';
import { formatDistance as fmtDist, formatPace as fmtPace } from '../../../core/utils/unitConverter';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PAGE_SIZE = 10;

function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();
  const unitSystem = useRunStore((s) => s.config.unitSystem);

  const [runs, setRuns] = useState<Run[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(
    async (cursor?: QueryDocumentSnapshot | null) => {
      if (!user) return;
      const isFirst = cursor === undefined;
      if (isFirst) setLoading(true);
      else setLoadingMore(true);

      try {
        const result = await RunRepository.getHistory(
          user.uid,
          PAGE_SIZE,
          cursor ?? undefined
        );
        if (isFirst) {
          setRuns(result.runs);
        } else {
          setRuns((prev) => [...prev, ...result.runs]);
        }
        setLastDoc(result.lastDoc);
        setHasMore(result.runs.length === PAGE_SIZE && result.lastDoc !== null);
      } catch (e) {
        console.error('[HistoryScreen] getHistory failed:', e);
      } finally {
        if (isFirst) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchPage(undefined);
  }, [fetchPage]);

  const handleEndReached = () => {
    if (!loadingMore && hasMore && lastDoc !== undefined) {
      fetchPage(lastDoc);
    }
  };

  const renderItem = ({ item }: { item: Run }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('RunDetail', { runId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <Text style={styles.itemDate}>{formatDate(item.date)}</Text>
        <Text style={styles.itemPace}>{fmtPace(item.pace, unitSystem)}</Text>
      </View>
      <Text style={styles.itemDistance}>{fmtDist(item.distance, unitSystem)}</Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{t('history.noRuns')}</Text>
        <Text style={styles.emptySubText}>{t('history.noRunsSub')}</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <CenteredLoader />
      ) : (
        <FlatList
          data={runs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemLeft: {
    flex: 1,
  },
  itemDate: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  itemPace: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
  },
  itemDistance: {
    color: colors.primary,
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
