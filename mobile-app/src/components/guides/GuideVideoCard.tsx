import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { GuideItem } from '@/types';
import { GuidesService } from '@/services/guidesService';
import { GuideStepsSheet } from './GuideStepsSheet';

interface GuideVideoCardProps {
  guide: GuideItem;
  height?: number;
}

export const GuideVideoCard: React.FC<GuideVideoCardProps> = ({
  guide,
  height,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const [helpfulCount, setHelpfulCount] = useState(guide.helpful_count);
  const [hasVoted, setHasVoted] = useState(false);
  const [stepsVisible, setStepsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);

  const cardHeight = height || Dimensions.get('window').height * 0.76;

  const handleHelpful = () => {
    if (!hasVoted) {
      setHasVoted(true);
      setHelpfulCount((prev) => prev + 1);
      GuidesService.trackInteraction(guide.id, 'helpful');
    }
  };

  const handleShare = async () => {
    const text = `📖 *GUÍA CÍVICA - COMISARÍA LA TINGUIÑA*\n\n📌 *${guide.title}*\n${guide.summary}\n\n📲 Revisa esta guía y pasos preventivos en la App Móvil de la Comisaría.`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        if (Platform.OS === 'web') {
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
        } else {
          await Clipboard.setStringAsync(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    } catch {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <View style={[styles.cardContainer, { height: cardHeight }]}>
        {/* Background: Native Video or Image */}
        {guide.main_video_url ? (
          <View style={styles.backgroundImage}>
            <Video
              source={{ uri: guide.main_video_url }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              shouldPlay={false}
              isLooping={false}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded) setIsBuffering(status.isBuffering);
              }}
            />
            {isBuffering && (
              <ActivityIndicator
                size="large"
                color="#FFFFFF"
                style={StyleSheet.absoluteFill}
              />
            )}
          </View>
        ) : (
          <Image
            source={{ uri: guide.thumbnail_url || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800' }}
            style={styles.backgroundImage}
            contentFit="cover"
            transition={300}
          />
        )}

        {/* Dark gradient overlay (pass-through for touches) */}
        <View style={styles.gradientOverlay} pointerEvents="none" />

        {/* Top Category Badge & Duration */}
        <View style={styles.topBar}>
          <View style={[styles.categoryBadge, { backgroundColor: 'rgba(4, 120, 87, 0.9)' }]}>
            <Feather name="shield" size={12} color="#FFFFFF" />
            <Text style={styles.categoryText}>
              {guide.category?.name || guide.category_name || 'Guía Cívica'}
            </Text>
          </View>
          <View style={styles.durationBadge}>
            <Feather name="clock" size={12} color="#FFFFFF" />
            <Text style={styles.durationText}>{guide.duration_seconds}s</Text>
          </View>
        </View>

        {/* Center Play Button indicator (only when static poster without video) */}
        {!guide.main_video_url && (
          <Pressable
            onPress={() => setStepsVisible(true)}
            style={({ pressed }) => [
              styles.centerPlayButton,
              { opacity: pressed ? 0.7 : 0.9 },
            ]}
          >
            <View style={styles.playIconCircle}>
              <Feather name="play" size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
            </View>
          </Pressable>
        )}

        {/* Right Side Action Rail */}
        <View style={styles.rightRail}>
          {/* Helpful Heart Button */}
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
                hasVoted && { backgroundColor: '#EF4444' },
              ]}
            >
              <Feather
                name="heart"
                size={22}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.actionText}>{helpfulCount}</Text>
            <Text style={styles.actionSubText}>Me ayudó</Text>
          </Pressable>

          {/* View Steps Button */}
          <Pressable
            onPress={() => setStepsVisible(true)}
            style={({ pressed }) => [
              styles.actionButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.actionIconCircle}>
              <Feather name="list" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>{guide.steps?.length || 4}</Text>
            <Text style={styles.actionSubText}>Pasos</Text>
          </Pressable>

          {/* Share Button */}
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.actionButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.actionIconCircle}>
              <Feather name="share-2" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>{copied ? 'Copiado' : 'Difundir'}</Text>
          </Pressable>
        </View>

        {/* Bottom Content Info */}
        <View style={styles.bottomContent}>
          <Text style={styles.title} numberOfLines={2}>
            {guide.title}
          </Text>
          <Text style={styles.summary} numberOfLines={2}>
            {guide.summary}
          </Text>

          {/* Bottom Action bar */}
          <View style={styles.bottomBar}>
            <Pressable
              onPress={() => setStepsVisible(true)}
              style={({ pressed }) => [
                styles.viewStepsButton,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="book-open" size={16} color="#FFFFFF" />
              <Text style={styles.viewStepsText}>Ver Transcripción y Pasos</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/denuncia/nueva' as any)}
              style={({ pressed }) => [
                styles.reportShortcutButton,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="shield" size={14} color="#047857" />
              <Text style={styles.reportShortcutText}>Denunciar</Text>
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
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
    marginBottom: Spacing.four,
    elevation: 8,
    ...Platform.select({
      web: { boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
    }),
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  topBar: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  durationText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 11,
  },
  centerPlayButton: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    zIndex: 5,
  },
  playIconCircle: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightRail: {
    position: 'absolute',
    right: Spacing.three,
    bottom: 120,
    alignItems: 'center',
    gap: Spacing.three,
    zIndex: 10,
  },
  actionButton: {
    alignItems: 'center',
    gap: 2,
  },
  actionIconCircle: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
    ...Platform.select({
      web: { textShadow: '0 1px 3px rgba(0,0,0,0.8)' },
      default: {
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  actionSubText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '500',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.four,
    paddingTop: Spacing.six,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    gap: Spacing.two,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    letterSpacing: -0.2,
    ...Platform.select({
      web: { textShadow: '0 1px 4px rgba(0,0,0,0.6)' },
      default: {
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
    }),
  },
  summary: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  viewStepsButton: {
    flex: 1.5,
    backgroundColor: '#047857',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two + 3,
    borderRadius: BorderRadius.md,
    gap: Spacing.one + 2,
  },
  viewStepsText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  reportShortcutButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two + 3,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  reportShortcutText: {
    color: '#047857',
    fontWeight: '800',
    fontSize: 13,
  },
});
