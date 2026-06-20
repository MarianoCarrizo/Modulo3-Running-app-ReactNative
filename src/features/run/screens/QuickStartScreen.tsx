import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Switch, ActivityIndicator, Pressable,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, radii } from '../../../core/theme';
import { MainDrawerParamList, RootStackParamList } from '../../../navigation';
import { useRunStore } from '../../../core/store/run.store';
import { unitLabel, displayToMeters } from '../../../core/utils/unitConverter';

type Nav = CompositeNavigationProp<
  DrawerNavigationProp<MainDrawerParamList, 'Carrera'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const MapWebView = React.memo(
  React.forwardRef<WebView, { html: string }>(function MapWebViewInner({ html }, ref) {
    return (
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        renderToHardwareTextureAndroid
      >
        <WebView
          ref={ref}
          style={StyleSheet.absoluteFill}
          source={{ html }}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          originWhitelist={['*']}
          javaScriptEnabled
        />
      </View>
    );
  })
);

import { useTranslation } from 'react-i18next';
import { RunConfig } from '../../../core/types';

const COUNTDOWN_OPTIONS = [0, 3, 5, 10];

function buildMapHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    html, body { overflow: hidden; overscroll-behavior: none; touch-action: none; }
    .leaflet-control-container { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false
    }).setView([${lat}, ${lng}], 17);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    var dotHtml = '<div style="width:14px;height:14px;background:#E8336D;border-radius:50%;border:2.5px solid #fff;box-shadow:0 0 0 7px rgba(232,51,109,0.2);"></div>';
    var dotIcon = L.divIcon({ html: dotHtml, iconSize: [14,14], iconAnchor: [7,7], className: '' });
    var marker = L.marker([${lat}, ${lng}], { icon: dotIcon }).addTo(map);

    function handleMsg(data) {
      try {
        var msg = JSON.parse(data);
        if (msg.type === 'location') {
          marker.setLatLng([msg.lat, msg.lng]);
        }
        if (msg.type === 'center') {
          map.setView([msg.lat, msg.lng], 17, { animate: true });
        }
      } catch(e) {}
    }

    window.addEventListener('message', function(e) { handleMsg(e.data); });
    document.addEventListener('message', function(e) { handleMsg(e.data); });
  </script>
</body>
</html>`;
}

export default function QuickStartScreen() {
  const navigation = useNavigation<Nav>();
  const storeSetConfig = useRunStore((s) => s.setConfig);
  const setGoalDistance = useRunStore((s) => s.setGoalDistance);
  const startCountdown = useRunStore((s) => s.startCountdown);
  const storedConfig = useRunStore((s) => s.config);

  const webViewRef = useRef<WebView>(null);
  const mapHtmlRef = useRef<string | null>(null);

  const { t } = useTranslation();
  const [gpsReady, setGpsReady] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [configVisible, setConfigVisible] = useState(false);
  const [goalVisible, setGoalVisible] = useState(false);
  const [goalDisplay, setGoalDisplay] = useState(0);
  const [config, setConfig] = useState<RunConfig>(storedConfig);

  useEffect(() => {
    setConfig(storedConfig);
  }, [storedConfig]);

  const handleStart = async () => {
    await storeSetConfig(config);
    setGoalDistance(displayToMeters(goalDisplay, config.unitSystem));
    startCountdown();
    navigation.navigate('Countdown', {
      countdown: config.countdown,
      config,
      goalDistance: displayToMeters(goalDisplay, config.unitSystem),
    });
  };

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        const coords = { latitude: last.coords.latitude, longitude: last.coords.longitude };
        mapHtmlRef.current = buildMapHtml(coords.latitude, coords.longitude);
        setLocation(coords);
        setGpsReady(true);
      }

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 0 },
        (pos) => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          if (!mapHtmlRef.current) {
            mapHtmlRef.current = buildMapHtml(coords.latitude, coords.longitude);
          }
          setLocation(coords);
          setGpsReady(true);
          webViewRef.current?.injectJavaScript(
            `handleMsg(${JSON.stringify(JSON.stringify({ type: 'location', lat: coords.latitude, lng: coords.longitude }))});true;`
          );
        }
      );
    })();

    return () => { sub?.remove(); };
  }, []);

  return (
    <View style={styles.root}>

      {!gpsReady && (
        <View style={styles.gpsLoading}>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: spacing.lg }} />
          <Text style={styles.gpsTitle}>{t('run.gpsSearching')}</Text>
          <Text style={styles.gpsSub}>{t('run.gpsSearchingSub')}</Text>
        </View>
      )}

      {gpsReady && mapHtmlRef.current && (
        <>
          <MapWebView ref={webViewRef} html={mapHtmlRef.current} />
          <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
            <Text style={styles.startBtnText}>{t('run.begin')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gearBtn} onPress={() => setConfigVisible(true)}>
            <Ionicons name="settings" size={26} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.objectiveBtn} onPress={() => setGoalVisible(true)}>
            <Text style={styles.objectiveBtnText}>
              {goalDisplay > 0
                ? t('run.goal', { value: goalDisplay.toFixed(1), unit: unitLabel(config.unitSystem) })
                : t('run.setGoal')}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <Modal visible={goalVisible} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={styles.modalOverlay} onPress={() => setGoalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('run.goalDistance')}</Text>
            <Text style={styles.sectionLabel}>
              {goalDisplay === 0
                ? t('run.noGoal')
                : `${goalDisplay.toFixed(1)} ${unitLabel(config.unitSystem)}`}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={config.unitSystem === 'imperial' ? 26.2 : 42.2}
              step={0.5}
              value={goalDisplay}
              onValueChange={setGoalDisplay}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <View style={styles.goalBtnRow}>
              <TouchableOpacity
                style={styles.goalClearBtn}
                onPress={() => { setGoalDisplay(0); setGoalVisible(false); }}
              >
                <Text style={styles.goalClearBtnText}>{t('run.noGoal')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setGoalVisible(false)}>
                <Text style={styles.closeBtnText}>{t('common.done')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={configVisible} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={styles.modalOverlay} onPress={() => setConfigVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>

            <Text style={styles.modalTitle}>{t('settings.title')}</Text>

            <Text style={styles.sectionLabel}>{t('settings.units')}</Text>
            <View style={styles.radioRow}>
              {(['metric', 'imperial'] as const).map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={styles.radioOption}
                  onPress={() => {
                    const next = { ...config, unitSystem: unit };
                    setConfig(next);
                    storeSetConfig(next);
                  }}
                >
                  <View style={[styles.radioCircle, config.unitSystem === unit && styles.radioCircleActive]}>
                    {config.unitSystem === unit && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.radioLabel}>
                    {unit === 'metric' ? t('settings.metric') : t('settings.imperial')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.sectionLabel}>{t('settings.voiceAlerts')}</Text>
              <Switch
                value={config.voiceAlerts}
                onValueChange={(v) => setConfig((c) => ({ ...c, voiceAlerts: v }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.text}
              />
            </View>

            {config.voiceAlerts && (
              <View style={styles.freqSection}>
                <Text style={styles.freqLabel}>
                  {t('settings.frequency', { value: config.alertFrequencyKm.toFixed(1), unit: config.unitSystem === 'imperial' ? 'mi' : 'km' })}
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0.5}
                  maximumValue={5}
                  step={0.5}
                  value={config.alertFrequencyKm}
                  onValueChange={(v) => setConfig((c) => ({ ...c, alertFrequencyKm: v }))}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
                />
              </View>
            )}

            <Text style={styles.sectionLabel}>{t('settings.countdown')}</Text>
            <View style={styles.chipRow}>
              {COUNTDOWN_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, config.countdown === s && styles.chipActive]}
                  onPress={() => setConfig((c) => ({ ...c, countdown: s }))}
                >
                  <Text style={[styles.chipText, config.countdown === s && styles.chipTextActive]}>
                    {s}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setConfigVisible(false)}>
              <Text style={styles.closeBtnText}>{t('common.close')}</Text>
            </TouchableOpacity>

          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  gpsLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  gpsTitle: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gpsSub: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  startBtn: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  startBtnText: {
    color: colors.text,
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  gearBtn: {
    position: 'absolute',
    bottom: 150,
    alignSelf: 'center',
    transform: [{ translateX: -100 }],
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  objectiveBtn: {
    position: 'absolute',
    bottom: 40,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    elevation: 4,
  },
  objectiveBtnText: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '500',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  modalTitle: {
    color: colors.primary,
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  radioRow: { flexDirection: 'row', gap: spacing.lg },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  radioLabel: { color: colors.text, fontSize: fontSizes.sm },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  freqSection: { marginBottom: spacing.xs },
  freqLabel: { color: colors.textSecondary, fontSize: fontSizes.sm, marginBottom: spacing.xs },
  slider: { width: '100%', height: 40 },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: fontSizes.sm },
  chipTextActive: { fontWeight: 'bold' },
  closeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignSelf: 'flex-end',
  },
  closeBtnText: { color: colors.text, fontWeight: 'bold', fontSize: fontSizes.md },
  goalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  goalClearBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  goalClearBtnText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
  },
});
