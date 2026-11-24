import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { VideoView, useVideoPlayer, VideoSource } from 'expo-video';
import { colors, fonts, radius, type } from '@/theme/tokens';
import { DotNumber } from './DotMatrix';
import { LogoMark, WaveHeader } from './Brand';
import { Icon, IconName } from './Icon';
import { IconButton, ProgressBar, T } from './ui';

/**
 * Premium / welcome demo player (screens 02, 52).
 * If a real trailer file is supplied via `source`, it plays with play/pause, mute and skip.
 * Until the final edited video exists, it plays an in-app *storyboard* built from real
 * app components – clearly labelled, never presented as a finished video.
 */
const SCENES: { id: string; caption: string; dur: number }[] = [
  { id: 'logo', caption: 'MIZRAHI PINTO', dur: 2200 },
  { id: 'home', caption: 'מספר אחד ברור לכל היום', dur: 3000 },
  { id: 'food', caption: 'הוספת מזון בשניות', dur: 2800 },
  { id: 'plan', caption: 'תכנון שבועי', dur: 2600 },
  { id: 'workout', caption: 'אימון פעיל עם טיימר', dur: 2800 },
  { id: 'stats', caption: 'גרפים שמראים התמדה', dur: 2600 },
  { id: 'premium', caption: 'Premium – בקרוב', dur: 2400 },
];

export function DemoPlayer({ source, onSkip, height = 360 }: { source?: VideoSource; onSkip?: () => void; height?: number }) {
  if (source) return <VideoDemo source={source} onSkip={onSkip} height={height} />;
  return <StoryboardDemo onSkip={onSkip} height={height} />;
}

/** expo-video players are imperative objects; mutate outside the render scope. */
function setPlayerMuted(p: { muted: boolean }, v: boolean) {
  p.muted = v;
}

function VideoDemo({ source, onSkip, height }: { source: VideoSource; onSkip?: () => void; height: number }) {
  const player = useVideoPlayer(source, (p) => { p.loop = true; p.muted = true; p.play(); });
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  return (
    <View style={[styles.frame, { height }]}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      <Controls playing={playing} onToggle={() => { if (playing) player.pause(); else player.play(); setPlaying(!playing); }} muted={muted} onMute={() => { setPlayerMuted(player, !muted); setMuted(!muted); }} onSkip={onSkip} />
    </View>
  );
}

function StoryboardDemo({ onSkip, height }: { onSkip?: () => void; height: number }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(!reduce);
  const [elapsed, setElapsed] = useState(0);
  const last = useRef(Date.now());
  const total = SCENES.reduce((m, s) => m + s.dur, 0);

  useEffect(() => {
    if (!playing) return;
    last.current = Date.now();
    const t = setInterval(() => {
      const now = Date.now();
      setElapsed((e) => {
        const n = (e + (now - last.current)) % total;
        let acc = 0, idx = 0;
        for (let k = 0; k < SCENES.length; k++) { if (n < acc + SCENES[k]!.dur) { idx = k; break; } acc += SCENES[k]!.dur; }
        setI(idx);
        return n;
      });
      last.current = now;
    }, 100);
    return () => clearInterval(t);
  }, [playing, total]);

  const scene = SCENES[i]!;
  return (
    <View style={[styles.frame, { height }]} accessibilityLabel={`הדגמת האפליקציה: ${scene.caption}`}>
      <View style={styles.tag}><Text style={styles.tagText}>סטוריבורד · הסרטון הסופי בהכנה</Text></View>
      <Animated.View key={scene.id} entering={reduce ? undefined : FadeIn.duration(450)} exiting={reduce ? undefined : FadeOut.duration(250)} style={styles.scene}>
        <Scene id={scene.id} />
      </Animated.View>
      <Text style={styles.caption}>{scene.caption}</Text>
      <ProgressBar value={elapsed / total} height={3} style={{ position: 'absolute', bottom: 64, left: 16, right: 16 }} />
      <Controls playing={playing} onToggle={() => setPlaying(!playing)} onSkip={onSkip} />
    </View>
  );
}

function Scene({ id }: { id: string }) {
  switch (id) {
    case 'logo':
      return <View style={{ alignItems: 'center' }}><LogoMark size={86} /></View>;
    case 'home':
      return (
        <View style={{ alignItems: 'center', gap: 8 }}>
          <DotNumber value={1420} dot={7} gap={2.6} />
          <T.Muted>קלוריות שנותרו להיום</T.Muted>
          <View style={{ marginTop: 6, transform: [{ scale: 0.7 }] }}><WaveHeader progress={0.6} /></View>
        </View>
      );
    case 'food':
      return <MiniCards items={[['bowl', 'קוטג׳ 5%', '95 קק״ל / 100 ג׳'], ['flame', 'חזה עוף', '165 קק״ל / 100 ג׳'], ['sparkle', 'בננה', '89 קק״ל / 100 ג׳']]} />;
    case 'plan':
      return <MiniCards items={[['calendar', 'ראשון', 'Push Day'], ['moon', 'שני', 'מנוחה'], ['calendar', 'שלישי', 'Pull Day']]} />;
    case 'workout':
      return (
        <View style={{ alignItems: 'center', gap: 10 }}>
          <DotNumber value={90} dot={6} gap={2.4} suffix="" label="90 שניות מנוחה" />
          <T.Muted>מנוחה · לחיצת חזה · סט 2/4</T.Muted>
        </View>
      );
    case 'stats':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 120 }}>
          {[0.4, 0.55, 0.7, 0.5, 0.85, 0.65, 0.95].map((h, k) => (
            <View key={k} style={{ width: 18, height: 120 * h, borderRadius: 6, backgroundColor: colors.accent, opacity: 0.4 + h * 0.6 }} />
          ))}
        </View>
      );
    default:
      return <View style={{ alignItems: 'center', gap: 8 }}><Icon name="crown" size={56} /><T.Title>Premium</T.Title></View>;
  }
}

function MiniCards({ items }: { items: [IconName, string, string][] }) {
  return (
    <View style={{ gap: 8, width: 240 }}>
      {items.map(([ic, a, b]) => (
        <View key={a} style={styles.mini}>
          <Icon name={ic} size={20} />
          <View style={{ flex: 1 }}><Text style={[type.bodyMedium, { color: colors.text }]}>{a}</Text><Text style={[type.caption, { color: colors.text2 }]}>{b}</Text></View>
        </View>
      ))}
    </View>
  );
}

function Controls({ playing, onToggle, muted, onMute, onSkip }: { playing: boolean; onToggle: () => void; muted?: boolean; onMute?: () => void; onSkip?: () => void }) {
  return (
    <View style={styles.controls}>
      <IconButton icon={playing ? 'pause' : 'play'} label={playing ? 'השהה' : 'נגן'} onPress={onToggle} size={42} />
      {onMute && <IconButton icon={muted ? 'mute' : 'volume'} label={muted ? 'בטל השתקה' : 'השתק'} onPress={onMute} size={42} />}
      <View style={{ flex: 1 }} />
      {onSkip && <IconButton icon="skip" label="דלג" onPress={onSkip} size={42} />}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: '#100906', borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  scene: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  caption: { position: 'absolute', bottom: 78, alignSelf: 'center', color: colors.text, fontFamily: fonts.medium, fontSize: 15 },
  controls: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', gap: 8, alignItems: 'center' },
  tag: { position: 'absolute', top: 12, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, zIndex: 2 },
  tagText: { color: colors.text2, fontFamily: fonts.regular, fontSize: 11 },
  mini: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
});
