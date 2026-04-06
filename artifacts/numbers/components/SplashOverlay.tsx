import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet } from "react-native";

const splashImage = require("@/assets/images/splash.jpg");

interface Props {
  onDone: () => void;
}

export function SplashOverlay({ onDone }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1s fade in
      Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: false }),
      // 2s hold at full opacity
      Animated.delay(2000),
      // 1s fade out
      Animated.timing(opacity, { toValue: 0, duration: 1000, useNativeDriver: false }),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });
  }, []);

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Image source={splashImage} style={styles.image} resizeMode="cover" />
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
