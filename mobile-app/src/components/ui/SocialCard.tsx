import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { Image } from 'expo-image';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CommunityReportItem } from '@/types';
import { StatusBadge } from './StatusBadge';
import { CommunityReportsService } from '@/services/communityReportsService';

interface SocialCardProps {
  report: CommunityReportItem;
  imageUrl?: string | null;
  onShared?: () => void;
}

export const SocialCard: React.FC<SocialCardProps> = ({
  report,
  imageUrl,
  onShared,
}) => {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(report.created_at).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const previewImage = imageUrl || (report.media_urls && report.media_urls[0]);

  const categoryLabel = report.category?.name || report.category_name || 'Incidencia Vecinal';

  const shareText = `🏛️ *REPORTE CIUDADANO - LA TINGUIÑA*\n\n📌 *Código:* ${report.public_code}\n⚠️ *Incidencia:* ${categoryLabel}\n📍 *Ubicación:* ${report.address_reference || 'La Tinguiña, Ica'}\n📝 *Detalle:* ${report.description}\n📅 *Fecha:* ${formattedDate}\n\n📲 *Seguimiento público:* Consulta el avance en la App Móvil Oficial de la Comisaría de La Tinguiña.`;

  const handleWhatsAppShare = async () => {
    CommunityReportsService.trackShare(report.public_code, 'whatsapp');
    const waUrl = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
    const waWebUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.open(waWebUrl, '_blank');
        } else {
          await Linking.openURL(waWebUrl);
        }
      } else {
        const supported = await Linking.canOpenURL(waUrl);
        if (supported) {
          await Linking.openURL(waUrl);
        } else {
          await Linking.openURL(waWebUrl).catch(async () => {
            await Clipboard.setStringAsync(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
          });
        }
      }
      onShared?.();
    } catch {
      await Clipboard.setStringAsync(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCopyText = async () => {
    await Clipboard.setStringAsync(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <View style={styles.container}>
      {/* Visual Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          },
        ]}
      >
        {/* Card Header */}
        <View style={[styles.cardHeader, { backgroundColor: theme.primaryDark }]}>
          <View style={styles.flagIcon}>
            <Feather name="shield" size={16} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.cardHeaderTitle}>REPORTE CÍVICO VECINAL</Text>
            <Text style={styles.cardHeaderSub}>Comisaría de La Tinguiña — Ica</Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={styles.codeRow}>
            <View>
              <Text style={[styles.label, { color: theme.textSecondary }]}>CÓDIGO DE SEGUIMIENTO</Text>
              <Text style={[styles.codeValue, { color: theme.primary }]}>{report.public_code}</Text>
            </View>
            <StatusBadge status={report.status} size="small" />
          </View>

          <View style={styles.fieldRow}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>CATEGORÍA:</Text>
            <Text style={[styles.value, { color: theme.text }]}>{categoryLabel}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>UBICACIÓN:</Text>
            <Text style={[styles.value, { color: theme.text }]} numberOfLines={2}>
              {report.address_reference || 'Sector urbano La Tinguiña'}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>FECHA:</Text>
            <Text style={[styles.value, { color: theme.text }]}>{formattedDate}</Text>
          </View>

          <View style={[styles.descBox, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.descText, { color: theme.text }]} numberOfLines={3}>
              &quot;{report.description}&quot;
            </Text>
          </View>

          {/* Photo attachment if available */}
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={styles.evidenceImage}
              contentFit="cover"
              transition={200}
            />
          )}

          <View style={[styles.cardFooter, { borderTopColor: theme.cardBorder }]}>
            <Text style={[styles.footerNotice, { color: theme.textSecondary }]}>
              🔒 Difusión comunitaria anónima (Sin datos personales)
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Pressable
          onPress={handleWhatsAppShare}
          style={({ pressed }) => [
            styles.whatsappButton,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name="message-circle" size={18} color="#FFFFFF" />
          <Text style={styles.whatsappButtonText}>Compartir en WhatsApp</Text>
        </Pressable>

        <Pressable
          onPress={handleCopyText}
          style={({ pressed }) => [
            styles.copyButton,
            {
              backgroundColor: copied ? theme.successLight : theme.backgroundElement,
              borderColor: copied ? theme.success : theme.cardBorder,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather
            name={copied ? 'check' : 'copy'}
            size={16}
            color={copied ? theme.success : theme.text}
          />
          <Text
            style={[
              styles.copyButtonText,
              { color: copied ? theme.success : theme.text },
            ]}
          >
            {copied ? '¡Copiado!' : 'Copiar Texto'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.three,
  },
  card: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
    }),
  },
  cardHeader: {
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flagIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardHeaderSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
  },
  cardBody: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  codeValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  descBox: {
    padding: Spacing.two + 2,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.one,
  },
  descText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  evidenceImage: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.one,
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: Spacing.two,
    alignItems: 'center',
  },
  footerNotice: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
    width: '100%',
  },
  whatsappButton: {
    flex: 1,
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.md,
    gap: Spacing.two,
    elevation: 3,
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)' },
      default: {
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
    }),
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.md,
    gap: Spacing.one,
    borderWidth: 1,
  },
  copyButtonText: {
    fontWeight: '600',
    fontSize: 13,
  },
});
