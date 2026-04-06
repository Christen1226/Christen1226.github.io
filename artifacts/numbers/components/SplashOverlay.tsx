import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

const splashImage = require("@/assets/images/splash.jpg");

interface Props {
  ready: boolean;
  onDone: () => void;
}

export function SplashOverlay({ ready, onDone }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in immediately
    Animated.timing(opacity, {
      toValue: 1,
      duration: 420,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    if (!ready) return;
    // Hold briefly then fade out once the app is ready
    const delay = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 480,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) onDone();
      });
    }, 600);
    return () => clearTimeout(delay);
  }, [ready]);

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
