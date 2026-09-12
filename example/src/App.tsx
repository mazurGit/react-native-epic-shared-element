import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import {
  SharedElement,
  SharedElementHost,
  SharedElementProvider,
  SharedElementTransition,
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
          <Text style={styles.eyebrow}>EPIC SHARED ELEMENT</Text>
          <Text style={styles.title}>One element, two layouts.</Text>
          <Text style={styles.subtitle}>
            Native measurements stay relative to the host while Reanimated
            drives the transition.
          </Text>
          <View style={styles.stage}>
            <Text style={styles.label}>SOURCE</Text>
            <SharedElement id="demo-artwork">
              <View style={[styles.artwork, styles.sourceArtwork]}>
                <Text style={styles.artworkText}>A</Text>
              </View>
            </SharedElement>
            <View style={styles.detailCopy}>
              <Text style={styles.detailTitle}>Aurora</Text>
              <Text style={styles.detailSubtitle}>Shared element showcase</Text>
            </View>
            <Text style={styles.label}>DESTINATION</Text>
            <SharedElement id="demo-artwork-detail">
              <View
                testID="destination-artwork"
                style={[styles.artwork, styles.destinationArtwork]}
              >
                <Text style={styles.artworkText}>A</Text>
              </View>
            </SharedElement>
          </View>
          <Pressable style={styles.button} onPress={toggle}>
            <Text style={styles.buttonText}>
              {expanded ? 'Reset transition' : 'Expand artwork'}
            </Text>
          </Pressable>
        </View>
        <SharedElementTransition
          startId="demo-artwork"
          endId="demo-artwork-detail"
          progress={progress}
          mode="zoom"
        />
      </SharedElementHost>
    </SharedElementProvider>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, backgroundColor: '#111018' },
  content: { flex: 1, padding: 28, paddingTop: 76 },
  eyebrow: {
    color: '#B9A7D9',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
  },
  title: {
    color: '#FFF',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    marginTop: 14,
  },
  subtitle: { color: '#AAA4B8', fontSize: 16, lineHeight: 23, marginTop: 14 },
  stage: { flex: 1, marginTop: 42 },
  label: {
    color: '#756D83',
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 12,
  },
  artwork: {
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9B5DE5',
    elevation: 8,
  },
  sourceArtwork: { width: 112, height: 112 },
  destinationArtwork: { width: '100%', height: 260 },
  artworkText: { color: '#FFF', fontSize: 58, fontWeight: '900' },
  detailCopy: { marginVertical: 28 },
  detailTitle: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  detailSubtitle: { color: '#AAA4B8', fontSize: 14, marginTop: 5 },
  button: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 17,
    alignItems: 'center',
  },
  buttonText: { color: '#17131D', fontSize: 16, fontWeight: '800' },
});
