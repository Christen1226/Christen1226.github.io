import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

const splashImage = require("@/assets/images/splash.jpg");

// Match the dominant purple from the splash image
const SPLASH_BG = "#9850EF";

interface Props {
  onDone: () => void;
}

export function SplashOverlay({ onDone }: Props) {
  // Controls the image fading in over the solid purple background
  const imageOpacity = useRef(new Animated.Value(0)).current;
  // Controls the entire overlay fading out at the end
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1s: image fades in over the solid purple bg
      Animated.timing(imageOpacity, { toValue: 1, duration: 1000, useNativeDriver: false }),
      // 2s hold at full visibility
      Animated.delay(2000),
      // 1s: entire overlay (image + bg) fades out
      Animated.timing(overlayOpacity, { toValue: 0, duration: 1000, useNativeDriver: false }),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });
  }, []);

  return (
    <Animated.View
      style={[styles.overlay, { opacity: overlayOpacity, backgroundColor: SPLASH_BG }]}
      pointerEvents="none"
    >
      <Animated.Image
        source={splashImage}
        style={[styles.image, { opacity: imageOpacity }]}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
