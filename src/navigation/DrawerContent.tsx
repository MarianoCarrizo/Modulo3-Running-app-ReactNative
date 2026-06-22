import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, ScrollView,
} from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../core/store/auth.store';
import { logout } from '../core/services/auth.service';
import { colors, spacing, fontSizes } from '../core/theme';

export default function DrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const user = useAuthStore((s) => s.user);
  const activeRoute = state.routes[state.index]?.name;
  const { t } = useTranslation();

  const MENU_ITEMS: { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; screen: string }[] = [
    { label: t('drawer.run'),         icon: 'walk-outline',       screen: 'Carrera' },
    { label: t('drawer.activity'),    icon: 'time-outline',       screen: 'Actividad' },
    { label: t('drawer.stats'),       icon: 'bar-chart-outline',  screen: 'Estadísticas' },
    { label: t('drawer.leaderboard'), icon: 'podium-outline',     screen: 'TablaLideres' },
    { label: t('drawer.challenges'),  icon: 'trophy-outline',     screen: 'Desafios' },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.root}>
      {/* Profile — tappable, navigates to Profile screen */}
      <TouchableOpacity
        style={styles.profile}
        onPress={() => navigation.navigate('Profile')}
        activeOpacity={0.7}
      >
        {user?.photoUrl ? (
          <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={36} color={colors.textMuted} />
          </View>
        )}
        <Text style={styles.greeting}>{t('drawer.greeting', { name: user?.name ?? 'Runner' })}</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Menu items */}
      <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map((item) => {
          const active = activeRoute === item.screen;
          return (
            <TouchableOpacity
              key={item.screen}
              style={[styles.menuItem, active && styles.menuItemActive]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={active ? colors.primary : colors.text}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom section */}
      <View style={styles.divider} />
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={22} color={colors.text} style={styles.menuIcon} />
          <Text style={styles.menuLabel}>{t('drawer.settings')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Ionicons name="exit-outline" size={22} color={colors.primary} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: colors.primary }]}>{t('common.logout')}</Text>
        </TouchableOpacity>
        <Text style={styles.version}>ALAMUTT RUNNING CLUB{'\n'}VERSION 2.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  profile: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: spacing.sm,
  },
  avatarFallback: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  menu: { flex: 1, paddingTop: spacing.sm },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuItemActive: { backgroundColor: colors.surface },
  menuIcon: { marginRight: spacing.md, width: 24 },
  menuLabel: { fontSize: fontSizes.md, color: colors.text },
  menuLabelActive: { color: colors.primary, fontWeight: '600' },
  bottom: { paddingBottom: spacing.lg },
  version: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
