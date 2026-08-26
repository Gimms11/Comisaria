import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { AppHeader } from '@/components/ui/AppHeader';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function CrimeReportSuccessScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    code: string;
    pin?: string;
    categoryName?: string;
    status?: string;
  }>();

  const [copied, setCopied] = useState(false);

  const publicCode = params.code || 'LT-2026-000000';
  const pin = params.pin || '';
  const categoryName = params.categoryName || 'Delito reportado';

  const handleCopy = async () => {
    const textToCopy = `🏛️ *COMPROBANTE DE DENUNCIA ANÓNIMA - PNP LA TINGUIÑA*\n\n📌 Código: ${publicCode}${
      pin ? `\n🔑 PIN Secreto: ${pin}` : ''
    }\n⚠️ Categoría: ${categoryName}\n\n📲 Consulta el estado en la app móvil.`;
    await Clipboard.setStringAsync(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <AppHeader
        title="Denuncia Registrada"
        subtitle="Comprobante Anónimo Oficial"
        showBack={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Emblem */}
        <View style={styles.emblemContainer}>
          <View style={[styles.emblemCircle, { backgroundColor: theme.primaryLight }]}>
            <Feather name="check-circle" size={48} color={theme.primary} />
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>
            ¡Denuncia Registrada con Éxito!
          </Text>
          <Text style={[styles.successSubtitle, { color: theme.textSecondary }]}>
            La guardia de la Comisaría de La Tinguiña ha recibido la alerta de forma 100% anónima.
          </Text>
        </View>

        {/* Code Box */}
        <View
          style={[
            styles.codeBox,
            {
              backgroundColor: theme.card,
              borderColor: theme.primary,
            },
          ]}
        >
          <Text style={[styles.codeLabel, { color: theme.textSecondary }]}>
            TU CÓDIGO PÚBLICO DE SEGUIMIENTO:
          </Text>
          <Text style={[styles.codeValue, { color: theme.primary }]}>
            {publicCode}
          </Text>

          {pin ? (
            <View style={[styles.pinBadge, { backgroundColor: theme.backgroundElement }]}>
              <Feather name="key" size={14} color={theme.text} />
              <Text style={[styles.pinText, { color: theme.text }]}>
                PIN Secreto: <Text style={{ fontWeight: '800' }}>{pin}</Text>
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleCopy}
            style={({ pressed }) => [
              styles.copyBtn,
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
                styles.copyBtnText,
                { color: copied ? theme.success : theme.text },
              ]}
            >
              {copied ? '¡Copiado al portapapeles!' : 'Copiar Código y PIN'}
            </Text>
          </Pressable>
        </View>

        {/* Instructions notice */}
        <View
          style={[
            styles.noticeCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <View style={styles.noticeRow}>
            <Feather name="shield" size={18} color={theme.primary} />
            <Text style={[styles.noticeText, { color: theme.text }]}>
              Guarda este código para verificar las diligencias policiales y notas del operador.
            </Text>
          </View>
          <View style={styles.noticeRow}>
            <Feather name="clock" size={18} color={theme.accent} />
            <Text style={[styles.noticeText, { color: theme.text }]}>
              El código también ha quedado guardado en la sección &quot;Mis Denuncias&quot; de este dispositivo.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable
            onPress={() => {
              router.replace({
                pathname: '/(tabs)/seguimiento',
                params: { code: publicCode, pin: pin || undefined },
              } as any);
            }}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="search" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Consultar Estado Ahora</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/(tabs)' as any)}
            style={({ pressed }) => [
              styles.secondaryBtn,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.cardBorder,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="home" size={18} color={theme.text} />
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
              Volver al Inicio
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.seven,
  },
  emblemContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  emblemCircle: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  codeBox: {
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    alignItems: 'center',
    gap: Spacing.two,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  codeValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
    marginVertical: 2,
  },
  pinText: {
    fontSize: 13,
    fontWeight: '600',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.one,
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  noticeCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.three,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  noticeText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  actionsContainer: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three + 2,
    borderRadius: BorderRadius.lg,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three + 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
