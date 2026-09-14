import { useCallback, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  SharedElement,
  SharedElementHost,
  SharedElementProvider,
  SharedElementTransition,
  SharedElementPresets,
  type SharedElementFrameChangeEvent,
} from 'react-native-epic-shared-element';

/* ------------------------------------------------------------------ */
/*  Data                                                              */
/* ------------------------------------------------------------------ */

type Palette = {
  bg: string;
  glow: string;
  orb: string;
  text: string;
  caption: string;
};

type TransitionPresetName = keyof typeof SharedElementPresets;

type Artwork = {
  id: string;
  letter: string;
  title: string;
  artist: string;
  year: string;
  medium: string;
  description: string;
  palette: Palette;
  transition: TransitionPresetName;
  cardRadius: number;
  detailRadius: number;
};

const ARTWORKS: Artwork[] = [
  {
    id: 'aurora',
    letter: 'A',
    title: 'Aurora',
    artist: 'Mila Anders',
    year: '2024',
    medium: 'Digital study',
    description:
      'A luminous gradient field exploring the boundary between noise and form — where colour bends light into shape.',
    transition: 'linear',
    cardRadius: 20,
    detailRadius: 8,
    palette: {
      bg: '#7B5DDB',
      glow: '#A38AF2',
      orb: '#E0B5FF',
      text: '#F7F2FF',
      caption: '#E9E0FF',
    },
  },
  {
    id: 'ember',
    letter: 'E',
    title: 'Ember',
    artist: 'Kai Renvi',
    year: '2023',
    medium: 'Generative print',
    description:
      'Warm decay rendered as geometry — each ember a fragment of a larger, fading constellation.',
    transition: 'spiral',
    cardRadius: 8,
    detailRadius: 28,
    palette: {
      bg: '#E0623A',
      glow: '#FF8A5C',
      orb: '#FFD18A',
      text: '#FFF5EE',
      caption: '#FFE0CC',
    },
  },
  {
    id: 'tide',
    letter: 'T',
    title: 'Tide',
    artist: 'Noor Halevi',
    year: '2024',
    medium: 'Algorithmic painting',
    description:
      'Flow fields collapse into standing waves. The tide is not water but the rhythm of its own making.',
    transition: 'slingshot',
    cardRadius: 28,
    detailRadius: 12,
    palette: {
      bg: '#2E8BA8',
      glow: '#5BC4D6',
      orb: '#B4F0E8',
      text: '#F0FDFF',
      caption: '#D0F4FA',
    },
  },
  {
    id: 'meadow',
    letter: 'M',
    title: 'Meadow',
    artist: 'Iris Lund',
    year: '2022',
    medium: 'Mixed digital media',
    description:
      'A field of recursive leaves, each generated from the shadow of the one before it.',
    transition: 'arc',
    cardRadius: 12,
    detailRadius: 36,
    palette: {
      bg: '#4CA85C',
      glow: '#86E08A',
      orb: '#D4F8A8',
      text: '#F4FFF0',
      caption: '#DCF8CE',
    },
  },
  {
    id: 'sunset',
    letter: 'S',
    title: 'Sunset',
    artist: 'Theo Marchetti',
    year: '2024',
    medium: 'Realtime shader',
    description:
      'A horizon that never quite sets — colour suspended in the moment between day and the memory of day.',
    transition: 'swoosh',
    cardRadius: 36,
    detailRadius: 6,
    palette: {
      bg: '#D64A7C',
      glow: '#FF7BA8',
      orb: '#FFC2D8',
      text: '#FFF0F5',
      caption: '#FFDDE8',
    },
  },
  {
    id: 'frost',
    letter: 'F',
    title: 'Frost',
    artist: 'Lena Okabe',
    year: '2023',
    medium: 'Vector composition',
    description:
      'Crystalline structures grown from a single seed vector, branching until the frame fills with quiet.',
    transition: 'portalWarp',
    cardRadius: 6,
    detailRadius: 24,
    palette: {
      bg: '#5A86C2',
      glow: '#8FBEF0',
      orb: '#DCEFFF',
      text: '#F4FAFF',
      caption: '#D6ECFF',
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Layout constants                                                  */
/* ------------------------------------------------------------------ */

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GUTTER = 14;
const COLUMNS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - 48 - GUTTER * (COLUMNS - 1)) / COLUMNS;
const DURATION = 620;

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailReady, setDetailReady] = useState(false);
  const [sourceSettledCount, setSourceSettledCount] = useState(0);
  const [detailSettledCount, setDetailSettledCount] = useState(0);
  const [observedFrameChange, setObservedFrameChange] = useState(false);
  const progress = useSharedValue(0);

  const selected = ARTWORKS.find((a) => a.id === selectedId) ?? null;

  const open = useCallback((id: string) => {
    setSelectedId(id);
    setDetailReady(false);
  }, []);

  const startDetailTransition = useCallback(() => {
    setDetailSettledCount((count) => count + 1);
    progress.value = withTiming(1, { duration: DURATION }, (finished) => {
      if (finished) runOnJS(setDetailReady)(true);
    });
  }, [progress]);

  const observeSourceFrameChange = useCallback(
    ({ previous, framesDiff }: SharedElementFrameChangeEvent) => {
      if (previous && framesDiff > 0) setObservedFrameChange(true);
    },
    []
  );

  const close = useCallback(() => {
    setDetailReady(false);
    progress.value = withTiming(0, { duration: DURATION }, (finished) => {
      if (finished) {
        runOnJS(setSelectedId)(null);
      }
    });
  }, [progress]);

  // Backdrop dims the grid as the hero flies forward.
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  // The detail sheet materialises as the hero arrives.
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
  }));

  // Body content slides up after the sheet is visible.
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0.65, 1],
      [0, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0.65, 1],
          [28, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  return (
    <SharedElementProvider>
      <SharedElementHost style={styles.host}>
        {/* ----------------------- Gallery grid ----------------------- */}
        <ScrollView
          testID="gallery-scroll"
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>EPIC / GALLERY</Text>
              <Text style={styles.title}>Shared moments</Text>
            </View>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>{ARTWORKS.length} WORKS</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Tap any work to see its hero fly from the grid to the detail view —
            measured natively, animated with Reanimated.
          </Text>

          <View style={styles.grid}>
            {ARTWORKS.map((artwork) => (
              <Pressable
                key={artwork.id}
                testID={`card-${artwork.id}`}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => open(artwork.id)}
              >
                <SharedElement
                  id={`art-${artwork.id}`}
                  borderRadius={artwork.cardRadius}
                  trackFrame={artwork.id === 'aurora'}
                  onFrameChange={
                    artwork.id === 'aurora'
                      ? observeSourceFrameChange
                      : undefined
                  }
                  onFrameSettled={
                    artwork.id === 'aurora'
                      ? () => setSourceSettledCount((count) => count + 1)
                      : undefined
                  }
                >
                  <Hero
                    artwork={artwork}
                    size="card"
                    radius={artwork.cardRadius}
                  />
                </SharedElement>
                <View style={styles.cardMeta}>
                  <View style={styles.cardMetaRow}>
                    <Text style={styles.cardTitle}>{artwork.title}</Text>
                    <Text style={styles.cardPreset}>{artwork.transition}</Text>
                  </View>
                  <Text style={styles.cardArtist}>{artwork.artist}</Text>
                </View>
              </Pressable>
            ))}
          </View>
          <View style={styles.footer} />
        </ScrollView>

        {/* ----------------------- Detail overlay ----------------------- */}
        {selected && (
          <Animated.View style={[styles.overlay, backdropStyle]}>
            <Pressable
              style={styles.backdrop}
              onPress={close}
              accessibilityLabel="Close detail"
            />
            <Animated.View
              style={[
                styles.sheet,
                {
                  borderTopLeftRadius: selected.detailRadius,
                  borderTopRightRadius: selected.detailRadius,
                },
                sheetStyle,
              ]}
            >
              <SharedElement
                id={`art-${selected.id}-detail`}
                borderRadius={selected.detailRadius}
                onFrameSettled={startDetailTransition}
              >
                <Hero
                  artwork={selected}
                  size="detail"
                  radius={selected.detailRadius}
                  testID="destination-artwork"
                />
              </SharedElement>

              <ScrollView
                style={styles.detailScroll}
                contentContainerStyle={styles.detailScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Animated.View style={contentStyle}>
                  <View style={styles.detailHeader}>
                    <Text style={styles.detailTitle}>{selected.title}</Text>
                    <Text testID="detail-artist" style={styles.detailSubtitle}>
                      {selected.artist} · {selected.year}
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaCell}>
                      <Text style={styles.metaLabel}>MEDIUM</Text>
                      <Text style={styles.metaValue}>{selected.medium}</Text>
                    </View>
                    <View style={styles.metaCell}>
                      <Text style={styles.metaLabel}>YEAR</Text>
                      <Text style={styles.metaValue}>{selected.year}</Text>
                    </View>
                    <View style={styles.metaCell}>
                      <Text style={styles.metaLabel}>EDITION</Text>
                      <Text style={styles.metaValue}>01 / 01</Text>
                    </View>
                  </View>

                  <Text style={styles.detailDescription}>
                    {selected.description}
                  </Text>
                </Animated.View>
              </ScrollView>
            </Animated.View>
          </Animated.View>
        )}

        {/* ------------- The flying clone (on top of everything) ------------- */}
        {selected && (
          <SharedElementTransition
            startId={`art-${selected.id}`}
            endId={`art-${selected.id}-detail`}
            progress={progress}
            mode="resize"
            transition={SharedElementPresets[selected.transition]}
          />
        )}
        {selected && detailReady && (
          <Pressable
            testID="close-detail"
            style={styles.closeButtonFloating}
            onPress={close}
            accessibilityLabel="Close"
            hitSlop={12}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        )}
        {__DEV__ && (
          <View style={styles.measurementDiagnostics}>
            <Text testID="source-settled-count">{sourceSettledCount}</Text>
            <Text testID="detail-settled-count">{detailSettledCount}</Text>
            <Text testID="frame-change-observed">
              {observedFrameChange ? 'changed' : 'waiting'}
            </Text>
          </View>
        )}
      </SharedElementHost>
    </SharedElementProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero — the shared visual used in both card and detail             */
/* ------------------------------------------------------------------ */

type HeroSize = 'card' | 'detail';

type HeroProps = {
  artwork: Artwork;
  size: HeroSize;
  radius: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

function Hero({ artwork, size, radius, testID, style }: HeroProps) {
  const p = artwork.palette;
  return (
    <View
      testID={testID}
      style={[
        styles.hero,
        { backgroundColor: p.bg },
        { borderRadius: radius },
        size === 'card' && styles.heroCard,
        size === 'detail' && styles.heroDetail,
        style,
      ]}
    >
      <View style={[styles.heroGlow, { backgroundColor: p.glow }]} />
      <View style={[styles.heroOrb, { backgroundColor: p.orb }]} />
      <Text style={[styles.heroLetter, { color: p.text }]}>
        {artwork.letter}
      </Text>
      <Text style={[styles.heroCaption, { color: p.caption }]}>
        {artwork.title.toUpperCase()}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  host: {
    flex: 1,
    backgroundColor: '#0D0D12',
  },
  measurementDiagnostics: {
    position: 'absolute',
    left: -1000,
    width: 1,
    height: 1,
  },

  /* ---- Gallery ---- */
  scroll: { flex: 1 },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#A99AE8',
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#292632',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B9F18C',
    marginRight: 6,
  },
  badgeText: {
    color: '#B9F18C',
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8A8492',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
    marginBottom: 28,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GUTTER,
  },
  card: {
    width: CARD_WIDTH,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  cardMeta: {
    paddingTop: 12,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#F7F4FF',
    fontSize: 15,
    fontWeight: '700',
  },
  cardArtist: {
    color: '#777185',
    fontSize: 11,
    marginTop: 3,
  },
  cardPreset: {
    color: '#7568A4',
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  footer: { height: 60 },

  /* ---- Detail overlay ---- */
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8, 7, 12, 0.9)',
  },
  sheet: {
    flex: 1,
    marginTop: 56,
    backgroundColor: '#131119',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  closeButtonFloating: {
    position: 'absolute',
    top: 72,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: 'rgba(35, 31, 46, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  closeIcon: {
    color: '#EDE7FF',
    fontSize: 15,
    fontWeight: '700',
  },
  detailScroll: { flex: 1 },
  detailScrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  detailHeader: {
    flexDirection: 'column',
  },
  detailTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  detailSubtitle: {
    color: '#A99AE8',
    fontSize: 13,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 22,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#231F2E',
  },
  metaCell: { flex: 1 },
  metaLabel: {
    color: '#625D6D',
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  metaValue: {
    color: '#BEB8C9',
    fontSize: 13,
    marginTop: 5,
    fontWeight: '600',
  },
  detailDescription: {
    color: '#D7D2E0',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 22,
  },

  /* ---- Hero ---- */
  hero: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroCard: {
    width: '100%',
    height: CARD_WIDTH,
  },
  heroDetail: {
    width: '100%',
    height: 300,
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.4,
    top: -70,
    right: -30,
  },
  heroOrb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.28,
    bottom: -42,
    left: -20,
  },
  heroLetter: {
    fontSize: 72,
    lineHeight: 80,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  heroCaption: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '800',
  },
});
