/**
 * SplashScreen.tsx  — Sacred Cosmos × Vedic Astronomy
 *
 * FIXES vs previous version:
 *  ✅ NO transformOrigin (unsupported in React Native)
 *  ✅ NO Math.random() inside Reanimated worklets
 *  ✅ Lotus petals use rotate + pivot trick via margin, not transformOrigin
 *  ✅ MandalaRing uses correct absolute positioning (no absoluteFillObject conflict)
 *  ✅ Star twinkle durations are pre-computed constants, not runtime random
 *  ✅ centerDisc is absolutely positioned directly, not wrapped in FadeIn
 *  ✅ All animations run purely on the UI thread
 *
 * Usage:
 *   const [splash, setSplash] = useState(true);
 *   if (splash) return <SplashScreen onFinish={() => setSplash(false)} />;
 */

import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Dimensions, StatusBar } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";

const { width: W, height: H } = Dimensions.get("window");
const CX = W / 2;
const FOCUS_Y = H * 0.4; // vertical centre for mandala + OM

// ─────────────────────────────────────────────
// PALETTE
// ─────────────────────────────────────────────
const C = {
  void: "#03050F",
  deep: "#0D1232",
  gold: "#D4A017",
  goldBright: "#F5C842",
  saffron: "#E8762A",
  lotus: "#C67ABE",
  lotusLight: "#E8A8DC",
  cream: "#FFF8E7",
  silver: "#B8C4D0",
};

// ─────────────────────────────────────────────
// PRE-COMPUTED STAR DATA
// (no Math.random at runtime — safe for worklets)
// ─────────────────────────────────────────────
const STAR_DATA = Array.from({ length: 72 }, (_, i) => ({
  x: (i * 137.508) % (W - 4),
  y: (i * 97.334) % (H * 0.88),
  size: i % 7 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
  dur1: 1100 + ((i * 173) % 900), // pre-computed, no Math.random
  dur2: 1000 + ((i * 211) % 900),
  initDelay: (i * 43) % 1800,
  color: i % 9 === 0 ? C.gold : i % 5 === 0 ? C.saffron : C.silver,
}));

// ─────────────────────────────────────────────
// STAR PARTICLE
// ─────────────────────────────────────────────
const StarParticle = React.memo(
  ({ x, y, size, dur1, dur2, initDelay, color }: (typeof STAR_DATA)[0]) => {
    const op = useSharedValue(0);

    useEffect(() => {
      op.value = withDelay(
        initDelay,
        withRepeat(
          withSequence(
            withTiming(0.15 + (size / 3) * 0.55, { duration: dur1 }),
            withTiming(0.05, { duration: dur2 }),
          ),
          -1,
          true,
        ),
      );
    }, []);

    const style = useAnimatedStyle(() => ({ opacity: op.value }));

    return (
      <Animated.View
        style={[
          {
            position: "absolute",
            left: x,
            top: y,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          style,
        ]}
      />
    );
  },
);

// ─────────────────────────────────────────────
// MANDALA RING
// Renders as an absolutely-positioned square centred on FOCUS_Y
// ─────────────────────────────────────────────
const MandalaRing = ({
  radius,
  petals,
  color,
  strokeW = 1,
  delay = 0,
  reverse = false,
  spinDuration = 20000,
}: {
  radius: number;
  petals: number;
  color: string;
  strokeW?: number;
  delay?: number;
  reverse?: boolean;
  spinDuration?: number;
}) => {
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 700 }));
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 14, stiffness: 55 }),
    );
    rotate.value = withDelay(
      delay + 300,
      withRepeat(
        withTiming(reverse ? -360 : 360, {
          duration: spinDuration,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  // Dot positions around the ring
  const dots = Array.from({ length: petals }, (_, i) => {
    const angleDeg = (360 / petals) * i - 90;
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: radius + radius * 0.88 * Math.cos(rad) - 3,
      y: radius + radius * 0.88 * Math.sin(rad) - 3,
    };
  });

  // Inner cross-hatch lines
  const lines = Array.from({ length: petals }, (_, i) => {
    const angleDeg = (360 / petals) * i - 90;
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: radius + radius * 0.55 * Math.cos(rad),
      y: radius + radius * 0.55 * Math.sin(rad),
      angle: angleDeg + 90,
    };
  });

  const D = radius * 2;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: D,
          height: D,
          top: FOCUS_Y - radius,
          left: CX - radius,
        },
        animStyle,
      ]}
    >
      {/* Ring circle */}
      <View
        style={{
          position: "absolute",
          width: D,
          height: D,
          borderRadius: radius,
          borderWidth: strokeW,
          borderColor: color + "55",
        }}
      />

      {/* Petal dots */}
      {dots.map((d, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: d.x,
            top: d.y,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
            opacity: 0.75,
          }}
        />
      ))}

      {/* Radial lines from dot toward centre */}
      {lines.map((l, i) => (
        <View
          key={`r${i}`}
          style={{
            position: "absolute",
            left: l.x,
            top: l.y,
            width: 1,
            height: radius * 0.32,
            backgroundColor: color + "28",
            transform: [{ rotate: `${l.angle}deg` }],
          }}
        />
      ))}
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// LOTUS PETAL
// Pivot trick: tall petal anchored at bottom-centre via
// negative marginTop so it appears to bloom outward from centre.
// No transformOrigin needed.
// ─────────────────────────────────────────────
const LotusPetal = ({
  angleDeg,
  delay,
  color,
  len,
  width: w = 16,
}: {
  angleDeg: number;
  delay: number;
  color: string;
  len: number;
  width?: number;
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.82, { duration: 550 }));
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 9, stiffness: 55 }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: w,
          height: len,
          // Place bottom of petal at FOCUS_Y, centred on CX
          top: FOCUS_Y - len,
          left: CX - w / 2,
          borderTopLeftRadius: w / 2,
          borderTopRightRadius: w / 2,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          backgroundColor: color,
          // Rotate around bottom-centre by translating, rotating, translating back
          transform: [
            { translateY: len / 2 }, // move pivot to bottom
            { rotate: `${angleDeg}deg` },
            { translateY: -(len / 2) }, // restore
            { scaleY: 0 }, // initial state — overridden by Animated
          ],
        },
        style, // animated scaleY overrides the static one
      ]}
    />
  );
};

// ─────────────────────────────────────────────
// OM SYMBOL  with breathing glow
// ─────────────────────────────────────────────
const OmSymbol = ({ delay }: { delay: number }) => {
  const scale = useSharedValue(0.1);
  const opacity = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 7, stiffness: 38 }),
    );
    glow.value = withDelay(
      delay + 500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.35, {
            duration: 1900,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.55,
    transform: [{ scale: 1 + glow.value * 0.22 }],
  }));

  const SIZE = 110;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: SIZE,
          height: SIZE,
          top: FOCUS_Y - SIZE / 2,
          left: CX - SIZE / 2,
          alignItems: "center",
          justifyContent: "center",
        },
        containerStyle,
      ]}
    >
      {/* Outer glow */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: SIZE * 1.6,
            height: SIZE * 1.6,
            borderRadius: SIZE * 0.8,
            backgroundColor: C.gold + "18",
            top: -(SIZE * 0.3),
            left: -(SIZE * 0.3),
          },
          glowStyle,
        ]}
      />
      {/* Inner glow */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: SIZE * 1.2,
            height: SIZE * 1.2,
            borderRadius: SIZE * 0.6,
            backgroundColor: C.gold + "28",
            top: -(SIZE * 0.1),
            left: -(SIZE * 0.1),
          },
          glowStyle,
        ]}
      />
      <Text
        style={{
          fontSize: 74,
          color: C.goldBright,
          textShadowColor: C.gold,
          textShadowRadius: 18,
          textShadowOffset: { width: 0, height: 0 },
          lineHeight: 88,
          includeFontPadding: false,
        }}
      >
        ॐ
      </Text>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// FADE-IN WRAPPER
// ─────────────────────────────────────────────
const FadeIn = ({
  delay,
  duration = 700,
  dy = 0,
  children,
}: {
  delay: number;
  duration?: number;
  dy?: number;
  children: React.ReactNode;
}) => {
  const op = useSharedValue(0);
  const ty = useSharedValue(dy);

  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration }));
    ty.value = withDelay(
      delay,
      withTiming(0, {
        duration: duration * 0.85,
        easing: Easing.out(Easing.quad),
      }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
};

// ─────────────────────────────────────────────
// TYPEWRITER
// ─────────────────────────────────────────────
const Typewriter = ({
  text,
  delay,
  style: s,
}: {
  text: string;
  delay: number;
  style?: any;
}) => {
  const [shown, setShown] = useState("");

  useEffect(() => {
    const init = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        setShown(text.slice(0, ++i));
        if (i >= text.length) clearInterval(iv);
      }, 65);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(init);
  }, [text, delay]);

  return <Text style={s}>{shown}</Text>;
};

// ─────────────────────────────────────────────
// MAIN SPLASH
// ─────────────────────────────────────────────
interface Props {
  onFinish: () => void;
  appName?: string;
  tagline?: string;
}

export default function CustomSplashScreen({
  onFinish,
  appName = "पञ्चाङ्ग",
  tagline = "Panchang  •  Bhajan  •  Jap  •  Gita",
}: Props) {
  const screenOp = useSharedValue(1);

  useEffect(() => {
    const t = setTimeout(() => {
      screenOp.value = withTiming(0, {
        duration: 550,
        easing: Easing.in(Easing.quad),
      });
      setTimeout(onFinish, 580);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOp.value }));

  // Lotus layer configs — 3 rings, 8+8+12 petals
  const petals = [
    ...Array.from({ length: 8 }, (_, i) => ({
      angleDeg: (360 / 8) * i,
      delay: 1050 + i * 70,
      color: C.lotus,
      len: 54,
      width: 18,
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
      angleDeg: (360 / 8) * i + 22.5,
      delay: 1150 + i * 70,
      color: C.lotusLight,
      len: 40,
      width: 15,
    })),
    ...Array.from({ length: 12 }, (_, i) => ({
      angleDeg: (360 / 12) * i,
      delay: 1280 + i * 55,
      color: C.gold + "BB",
      len: 26,
      width: 10,
    })),
  ];

  return (
    <Animated.View style={[st.root, screenStyle]}>
      <StatusBar hidden />

      {/* ── Background nebula layers ── */}
      <View style={st.bg0} />
      <View style={st.bg1} />
      <View style={st.bg2} />
      <View style={st.bg3} />

      {/* ── Stars ── */}
      {STAR_DATA.map((s, i) => (
        <StarParticle key={i} {...s} />
      ))}

      {/* ── Mandala rings (outer → inner) ── */}
      <MandalaRing
        radius={158}
        petals={18}
        color={C.gold}
        strokeW={0.5}
        delay={250}
        reverse={false}
        spinDuration={30000}
      />
      <MandalaRing
        radius={120}
        petals={12}
        color={C.saffron}
        strokeW={1}
        delay={600}
        reverse={true}
        spinDuration={20000}
      />
      <MandalaRing
        radius={84}
        petals={8}
        color={C.goldBright}
        strokeW={1.5}
        delay={850}
        reverse={false}
        spinDuration={13000}
      />

      {/* ── Centre disc ── */}
      <View style={st.disc} />

      {/* ── Lotus petals ── */}
      {petals.map((p, i) => (
        <LotusPetal key={i} {...p} />
      ))}

      {/* ── OM symbol ── */}
      <OmSymbol delay={1450} />

      {/* ── Bottom content ── */}
      <View style={st.bottom}>
        <FadeIn delay={2050} duration={650}>
          <View style={st.divRow}>
            <View style={st.divLine} />
            <Text style={st.divStar}>✦</Text>
            <View style={st.divLine} />
          </View>
        </FadeIn>

        <FadeIn delay={2050} duration={700} dy={14}>
          <Text style={st.omTatSat}>ॐ तत् सत्</Text>
        </FadeIn>

        <View style={st.nameRow}>
          <Typewriter text={appName} delay={2500} style={st.appName} />
        </View>

        <FadeIn delay={3100} duration={600} dy={8}>
          <Text style={st.tagline}>{tagline}</Text>
        </FadeIn>

        <FadeIn delay={3250} duration={500}>
          <Text style={st.mantra}>
            सर्वे भवन्तु सुखिनः · May all beings be happy
          </Text>
        </FadeIn>

        <FadeIn delay={2700} duration={800}>
          <Text style={st.lotusEmoji}>🪷</Text>
        </FadeIn>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.void,
  },

  // Nebula bg
  bg0: { ...StyleSheet.absoluteFillObject, backgroundColor: C.void },
  bg1: {
    position: "absolute",
    borderRadius: W * 0.7,
    width: W * 1.4,
    height: W * 1.4,
    top: FOCUS_Y - W * 0.72,
    left: -W * 0.2,
    backgroundColor: "#0C1848",
    opacity: 0.5,
  },
  bg2: {
    position: "absolute",
    borderRadius: W * 0.45,
    width: W * 0.9,
    height: W * 0.9,
    top: FOCUS_Y - W * 0.4,
    left: CX - W * 0.45,
    backgroundColor: "#1A0A2E",
    opacity: 0.6,
  },
  bg3: {
    position: "absolute",
    borderRadius: W * 0.28,
    width: W * 0.56,
    height: W * 0.56,
    top: FOCUS_Y - W * 0.24,
    left: CX - W * 0.28,
    backgroundColor: C.deep,
    opacity: 0.75,
  },

  // Centre disc
  disc: {
    position: "absolute",
    width: 106,
    height: 106,
    borderRadius: 53,
    top: FOCUS_Y - 53,
    left: CX - 53,
    backgroundColor: "#160924",
    borderWidth: 1.5,
    borderColor: C.gold + "55",
    shadowColor: C.gold,
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },

  // Bottom stack
  bottom: {
    position: "absolute",
    bottom: 44,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  divRow: {
    flexDirection: "row",
    alignItems: "center",
    width: W * 0.68,
    marginBottom: 10,
    gap: 8,
  },
  divLine: { flex: 1, height: 1, backgroundColor: C.gold + "50" },
  divStar: { fontSize: 10, color: C.gold },

  omTatSat: {
    fontSize: 15,
    color: C.gold + "DD",
    letterSpacing: 7,
    fontWeight: "300",
    marginBottom: 12,
    textShadowColor: C.gold + "80",
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },

  nameRow: {
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  appName: {
    fontSize: 50,
    fontWeight: "700",
    color: C.cream,
    letterSpacing: 3,
    textShadowColor: C.gold,
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  },

  tagline: {
    fontSize: 11,
    color: C.silver + "CC",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    marginBottom: 22,
  },

  mantra: {
    fontSize: 11,
    color: C.gold + "65",
    letterSpacing: 0.4,
    fontStyle: "italic",
    marginBottom: 14,
  },

  lotusEmoji: {
    fontSize: 22,
    opacity: 0.8,
  },
});
