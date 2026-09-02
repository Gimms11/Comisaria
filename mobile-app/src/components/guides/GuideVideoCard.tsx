import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Platform,
  ActivityIndicator,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { BorderRadius, Spacing } from '@/constants/theme';
import { GuideItem } from '@/types';
import { GuidesService } from '@/services/guidesService';
import { GuideStepsSheet } from './GuideStepsSheet';

interface GuideVideoCardProps {
  guide: GuideItem;
  height: number;
  isActive?: boolean;
  renderMode?: 'active' | 'preload' | 'thumbnail_only';
}

export const GuideVideoCard: React.FC<GuideVideoCardProps> = ({
  guide,
  height,
  isActive = true,
  renderMode = 'active',
}) => {
  const router = useRouter();

  const [helpfulCount, setHelpfulCount] = useState(guide.helpful_count);
  const [hasVoted, setHasVoted] = useState(false);
  const [stepsVisible, setStepsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  // Playback Progress & Scrubber State (in seconds)
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(guide.duration_seconds || 45);
  const [progressBarWidth, setProgressBarWidth] = useState(300);

  // Initialize official Expo Video player
  const videoSource = guide.main_video_url || '';
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = isMuted;
    if (isActive && isPlaying && renderMode === 'active') {
      p.play();
    }
  });

  // Sync player lifecycle events
  useEffect(() => {
    if (!player) return;

    const timeSub = player.addListener('timeUpdate', (event) => {
      if (typeof event.currentTime === 'number' && Number.isFinite(event.currentTime)) {
        setCurrentSeconds(event.currentTime);
      }
      if (player.duration && Number.isFinite(player.duration) && player.duration > 0) {
        setDurationSeconds(player.duration);
      }
    });

    const playSub = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });

    const statusSub = player.addListener('statusChange', (event) => {
      if (event.status === 'loading') {
        setIsBuffering(true);
      } else if (event.status === 'readyToPlay') {
        setIsBuffering(false);
        setHasVideoError(false);
        if (player.duration && player.duration > 0) {
          setDurationSeconds(player.duration);
        }
      } else if (event.status === 'error') {
        setIsBuffering(false);
        setHasVideoError(true);
      }
    });

    return () => {
      timeSub.remove();
      playSub.remove();
      statusSub.remove();
    };
  }, [player]);

  // Sync active play/pause with focus/active window
  useEffect(() => {
    if (!player) return;
    if (isActive && isPlaying && renderMode === 'active') {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, renderMode, isPlaying, player]);

  // Sync mute state
  useEffect(() => {
    if (player) {
      player.muted = isMuted;
    }
  }, [isMuted, player]);

  const handleHelpful = () => {
    if (!hasVoted) {
      setHasVoted(true);
      setHelpfulCount((prev) => prev + 1);
      GuidesService.trackInteraction(guide.id, 'helpful');
    }
  };

  const handleShare = async () => {
    const text = `📖 *GUÍA CÍVICA - COMISARÍA LA TINGUIÑA*\n\n📌 *${guide.title}*\n${guide.summary}\n\n📲 Revisa esta guía y pasos preventivos en la App Móvil de la Comisaría.`;
    const waUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    const waWebUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(waWebUrl, '_blank');
      } else {
        const supported = await Linking.canOpenURL(waUrl);
        if (supported) {
          await Linking.openURL(waUrl);
        } else {
          await Linking.openURL(waWebUrl).catch(async () => {
            await Clipboard.setStringAsync(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        }
      }
    } catch {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const togglePlayPause = () => {
    if (!guide.main_video_url || hasVideoError || renderMode === 'thumbnail_only' || !player) {
      setStepsVisible(true);
      return;
    }

    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (player) {
      player.muted = nextMuted;
    }
  };

  // Safe Seek / Scrubber Handler
  const handleSeek = (e: GestureResponderEvent) => {
    if (
      !guide.main_video_url ||
      hasVideoError ||
      !durationSeconds ||
      durationSeconds <= 0 ||
      !Number.isFinite(durationSeconds) ||
      !player
    ) {
      return;
    }

    const nativeEvt = e.nativeEvent as any;
    let locX: number | null = null;
    if (typeof nativeEvt.locationX === 'number' && Number.isFinite(nativeEvt.locationX)) {
      locX = nativeEvt.locationX;
    } else if (typeof nativeEvt.offsetX === 'number' && Number.isFinite(nativeEvt.offsetX)) {
      locX = nativeEvt.offsetX;
    } else if (typeof nativeEvt.layerX === 'number' && Number.isFinite(nativeEvt.layerX)) {
      locX = nativeEvt.layerX;
    } else if (typeof nativeEvt.pageX === 'number' && Number.isFinite(nativeEvt.pageX) && nativeEvt.target) {
      const rect = nativeEvt.target.getBoundingClientRect?.();
      if (rect) {
        locX = nativeEvt.pageX - rect.left;
      }
    }

    if (locX === null || !progressBarWidth || progressBarWidth <= 0 || !Number.isFinite(progressBarWidth)) {
      return;
    }

    const seekRatio = Math.max(0, Math.min(1, locX / progressBarWidth));
    if (!Number.isFinite(seekRatio)) return;

    const targetSecs = Math.max(0, Math.min(durationSeconds, seekRatio * durationSeconds));
    if (!Number.isFinite(targetSecs)) return;

    setCurrentSeconds(targetSecs);
    try {
      player.currentTime = targetSecs;
    } catch (err) {
      console.warn('Seek error:', err);
    }
  };

  const handleProgressBarLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0 && Number.isFinite(width)) {
      setProgressBarWidth(width);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !Number.isFinite(seconds) || seconds < 0) return '0:00';
    const totalSecs = Math.floor(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent =
    durationSeconds > 0 && Number.isFinite(durationSeconds) && Number.isFinite(currentSeconds)
      ? Math.max(0, Math.min(100, (currentSeconds / durationSeconds) * 100))
      : 0;

  // Render VideoView only in active or preload slot with valid URL
  const shouldMountVideo =
    guide.main_video_url &&
    !hasVideoError &&
    (renderMode === 'active' || renderMode === 'preload');

  return (
    <>
      {/* Outer Viewport Container: Centered on desktop/tablet, full-width on mobile */}
      <View style={[styles.cardContainer, { height }]}>
        <View style={styles.responsiveCanvas}>
          {/* Main Media Layer */}
          <Pressable onPress={togglePlayPause} style={styles.mediaPressable}>
            {/* Base Poster (Poster-First Strategy to prevent any black flicker) */}
            <Image
              source={{
                uri:
                  guide.thumbnail_url ||
                  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
              }}
              style={styles.fullImageElement}
              contentFit="contain"
              priority="high"
              cachePolicy="memory-disk"
              transition={200}
            />

            {/* Native Video Player only mounted when within the 3-slot active/preload window */}
            {shouldMountVideo && player && (
              <View style={styles.videoPlayerBox}>
                <VideoView
                  style={styles.fullVideoElement}
                  player={player}
                  nativeControls={false}
                  contentFit="contain"
                />
                {isBuffering && (
                  <View style={styles.centerLoading}>
                    <ActivityIndicator size="large" color="#10B981" />
                  </View>
                )}
              </View>
            )}

            {/* Dark gradient overlay */}
            <View style={styles.gradientOverlay} />

            {/* Pause overlay indicator */}
            {!isPlaying && renderMode === 'active' && (
              <View style={styles.pausedIndicator}>
                <View style={styles.pauseCircle}>
                  <Feather name="play" size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </View>
              </View>
            )}
          </Pressable>

          {/* Top Badges & Volume Mute button */}
          <View style={styles.topBar}>
            <View style={styles.topLeftBadges}>
              <View style={[styles.categoryBadge, { backgroundColor: '#047857' }]}>
                <Feather name="shield" size={11} color="#FFFFFF" />
                <Text style={styles.categoryText}>
                  {guide.category?.name || guide.category_name || 'Guía Cívica'}
                </Text>
              </View>

              <View style={styles.durationBadge}>
                <Feather name="clock" size={11} color="#FDE047" />
                <Text style={styles.durationText}>{guide.duration_seconds}s</Text>
              </View>
            </View>

            {guide.main_video_url && !hasVideoError && (
              <Pressable
                onPress={toggleMute}
                style={({ pressed }) => [
                  styles.muteButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Feather
                  name={isMuted ? 'volume-x' : 'volume-2'}
                  size={16}
                  color="#FFFFFF"
                />
              </Pressable>
            )}
          </View>

          {/* Right TikTok-style Action Bar */}
          <View style={styles.rightRail}>
            {/* 1. Heart / Helpful */}
            <Pressable
              onPress={handleHelpful}
              style={({ pressed }) => [
                styles.actionButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View
                style={[
                  styles.actionIconCircle,
                  hasVoted && { backgroundColor: '#EF4444', borderColor: '#EF4444' },
                ]}
              >
                <Feather
                  name="heart"
                  size={22}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.actionText}>{helpfulCount}</Text>
              <Text style={styles.actionSubText}>Útil</Text>
            </Pressable>

            {/* 2. REEMPLAZO DE COMENTARIOS: Botón de Pasos / Detalle */}
            <Pressable
              onPress={() => setStepsVisible(true)}
              style={({ pressed }) => [
                styles.actionButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#0284C7', borderColor: '#38BDF8' }]}>
                <Feather name="file-text" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Pasos</Text>
              <Text style={styles.actionSubText}>Detalle</Text>
            </Pressable>

            {/* 3. Compartir / Difundir */}
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                styles.actionButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.actionIconCircle}>
                <Feather name="share-2" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>{copied ? 'Copiado' : 'Difundir'}</Text>
            </Pressable>

            {/* 4. Denuncia Rápida Shortcut */}
            <Pressable
              onPress={() => router.push('/denuncia/nueva' as any)}
              style={({ pressed }) => [
                styles.actionButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#DC2626', borderColor: '#EF4444' }]}>
                <Feather name="alert-triangle" size={18} color="#FFFFFF" />
              </View>
              <Text style={[styles.actionText, { color: '#FCA5A5' }]}>Denuncia</Text>
            </Pressable>
          </View>

          {/* Bottom Content Info */}
          <View style={styles.bottomContent}>
            {/* Official Police Channel Header */}
            <View style={styles.channelRow}>
              <View style={styles.channelAvatar}>
                <Feather name="shield" size={11} color="#FFFFFF" />
              </View>
              <Text style={styles.channelName}>@comisaria_latinguina</Text>
              <View style={styles.verifiedDot} />
            </View>

            {/* Title */}
            <Text style={styles.title} numberOfLines={2}>
              {guide.title}
            </Text>

            {/* Summary */}
            <Text style={styles.summary} numberOfLines={2}>
              {guide.summary}
            </Text>

            {/* Audio & Time Stamp Row */}
            <View style={styles.bottomBarRow}>
              <View style={styles.musicTicker}>
                <Feather name={isMuted ? 'volume-x' : 'volume-2'} size={11} color={isMuted ? '#94A3B8' : '#A7F3D0'} />
                <Text style={[styles.musicText, isMuted && { color: '#94A3B8' }]} numberOfLines={1}>
                  {isMuted ? 'Video Silenciado por defecto • PNP' : 'Orientación Preventiva • PNP La Tinguiña'}
                </Text>
              </View>

              {/* Time Stamp display */}
              <Text style={styles.timeCounterText}>
                {formatTime(currentSeconds)} / {formatTime(durationSeconds)}
              </Text>
            </View>

            {/* INTERACTIVE VIDEO PROGRESS BAR / SCRUBBER */}
            <Pressable
              onPress={handleSeek}
              onLayout={handleProgressBarLayout}
              style={styles.progressBarTouchArea}
            >
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFilled, { width: `${progressPercent}%` }]} />
                <View style={[styles.scrubberHandle, { left: `${Math.max(0, Math.min(98, progressPercent))}%` }]} />
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      <GuideStepsSheet
        guide={guide}
        visible={stepsVisible}
        onClose={() => setStepsVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    backgroundColor: '#05070B',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  responsiveCanvas: {
    width: '100%',
    maxWidth: 440,
    height: '100%',
    position: 'relative',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  mediaPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  fullVideoElement: {
    width: '100%',
    height: '100%',
  },
  fullImageElement: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    pointerEvents: 'none',
  },
  centerLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  pauseCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 15,
  },
  topLeftBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  durationText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  muteButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightRail: {
    position: 'absolute',
    right: Spacing.three,
    bottom: 85,
    alignItems: 'center',
    gap: Spacing.two + 4,
    zIndex: 20,
  },
  actionButton: {
    alignItems: 'center',
    gap: 2,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
  },
  actionSubText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 9,
    fontWeight: '600',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    paddingLeft: Spacing.three + 2,
    paddingRight: 64,
    paddingBottom: Platform.OS === 'ios' ? Spacing.four : Spacing.three,
    paddingTop: Spacing.two,
    gap: 4,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  channelAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#047857',
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  verifiedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#38BDF8',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  summary: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    lineHeight: 15,
  },
  bottomBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 1,
  },
  musicTicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  musicText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '600',
  },
  timeCounterText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressBarTouchArea: {
    paddingVertical: 4,
    width: '100%',
    justifyContent: 'center',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFilled: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  scrubberHandle: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },
});
