import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import {
  SharedElement,
  SharedElementHost,
  SharedElementProvider,
  SharedElementTransition,
  sharedElementTransitionPresets,
} from 'react-native-epic-shared-element';

export default function App() {
  const [expanded, setExpanded] = useState(false);
  const progress = useSharedValue(0);
  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    progress.value = withTiming(next ? 1 : 0, { duration: 650 });
  };
  return (
    <SharedElementProvider>
      <SharedElementHost style={styles.host}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>EPIC / PLAYGROUND</Text>
              <Text style={styles.title}>Shared moments</Text>
            </View>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            One element, two layouts — measured natively and animated with
            Reanimated.
          </Text>
          <View style={styles.stage}>
            <View style={styles.sourceCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.label}>COLLECTION / 01</Text>
                <Text style={styles.cardIndex}>01—04</Text>
              </View>
              <SharedElement id="demo-artwork">
                <View style={[styles.artwork, styles.sourceArtwork]}>
                  <View style={styles.artworkGlow} />
                  <View style={styles.artworkOrb} />
                  <Text style={styles.artworkLetter}>A</Text>
                  <Text style={styles.artworkCaption}>AURORA</Text>
                </View>
              </SharedElement>
              <View style={styles.sourceFooter}>
                <View>
                  <Text style={styles.detailTitle}>Aurora</Text>
                  <Text style={styles.detailSubtitle}>
                    No. 01 / Digital study
                  </Text>
                </View>
                <Text style={styles.arrow}>↗</Text>
              </View>
            </View>

            <View style={styles.destinationSection}>
              <View style={styles.sectionLine} />
              <Text style={styles.label}>DETAIL VIEW</Text>
            </View>
            <SharedElement id="demo-artwork-detail">
              <View
                testID="destination-artwork"
                style={[styles.artwork, styles.destinationArtwork]}
              >
                <View style={styles.artworkGlow} />
                <View style={styles.artworkOrb} />
                <Text style={styles.artworkLetter}>A</Text>
                <Text style={styles.artworkCaption}>AURORA / 01</Text>
              </View>
            </SharedElement>
            <View style={styles.detailMeta}>
              <View>
                <Text style={styles.metaLabel}>ARTIST</Text>
                <Text style={styles.metaValue}>Mila Anders</Text>
              </View>
              <View>
                <Text style={styles.metaLabel}>FORMAT</Text>
                <Text style={styles.metaValue}>Digital / 2024</Text>
              </View>
              <Text style={styles.metaArrow}>↗</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={toggle}
          >
            <View style={styles.buttonIcon}>
              <Text style={styles.buttonIconText}>{expanded ? '↙' : '↗'}</Text>
            </View>
            <Text style={styles.buttonText}>
              {expanded ? 'Reset transition' : 'Expand artwork'}
            </Text>
            <Text style={styles.buttonHint}>TAP TO TRANSITION</Text>
          </Pressable>
        </View>
        <SharedElementTransition
          startId="demo-artwork"
          endId="demo-artwork-detail"
          progress={progress}
          mode="zoom"
          transition={sharedElementTransitionPresets.linear}
          clip
        />
      </SharedElementHost>
    </SharedElementProvider>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, backgroundColor: '#0D0D12' },
  content: { flex: 1, padding: 24, paddingTop: 64 },
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
    color: '#FFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    marginTop: 8,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#292632',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B9F18C',
    marginRight: 6,
  },
  liveText: {
    color: '#B9F18C',
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  subtitle: {
    color: '#8E899B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
    maxWidth: 310,
  },
  stage: { flex: 1, marginTop: 28 },
  sourceCard: {
    backgroundColor: '#17151E',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#26232F',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardIndex: {
    color: '#5E596A',
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
  },
  label: {
    color: '#777185',
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: '700',
  },
  artwork: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B5DDB',
    overflow: 'hidden',
  },
  sourceArtwork: { width: '100%', height: 190 },
  destinationArtwork: { width: '100%', height: 260 },
  artworkGlow: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#A38AF2',
    opacity: 0.42,
    top: -80,
    right: -36,
  },
  artworkOrb: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#E0B5FF',
    opacity: 0.28,
    bottom: -48,
    left: -22,
  },
  artworkLetter: {
    color: '#F7F2FF',
    fontSize: 82,
    lineHeight: 92,
    fontWeight: '900',
    fontStyle: 'italic',
    textShadowColor: '#4A358F',
    textShadowOffset: { width: 0, height: 7 },
    textShadowRadius: 12,
  },
  artworkCaption: {
    position: 'absolute',
    right: 16,
    bottom: 14,
    color: '#E9E0FF',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '800',
  },
  sourceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  detailTitle: { color: '#F7F4FF', fontSize: 22, fontWeight: '800' },
  detailSubtitle: { color: '#777185', fontSize: 12, marginTop: 5 },
  arrow: { color: '#A99AE8', fontSize: 27, fontWeight: '300' },
  destinationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 10,
  },
  sectionLine: {
    height: 1,
    width: 24,
    backgroundColor: '#A99AE8',
    marginRight: 9,
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
  },
  metaLabel: {
    color: '#625D6D',
    fontSize: 8,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  metaValue: { color: '#BEB8C9', fontSize: 11, marginTop: 5 },
  metaArrow: { color: '#5E596A', fontSize: 22 },
  button: {
    backgroundColor: '#B7A6F2',
    borderRadius: 18,
    minHeight: 62,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  buttonPressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  buttonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A213A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  buttonIconText: { color: '#EDE7FF', fontSize: 19 },
  buttonText: { color: '#241C32', fontSize: 15, fontWeight: '800', flex: 1 },
  buttonHint: {
    color: '#665587',
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '800',
  },
});
