import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { WalkingMascot } from './WalkingMascot';

const DAILY_TIPS = [
  'En días calurosos, lleva agua y evita el asfalto al mediodía.',
  'Un paseo de 30 a 45 minutos suele ser ideal para la mayoría de perros adultos.',
  'Revisa patitas al volver: piedras o calor pueden lastimarlas.',
  'Premia con cariño al final del paseo: refuerza que salir es algo bueno.',
  'Si tu perro tira de la correa, pausas cortas ayudan más que jalar.',
  'Los olores son su forma de leer el barrio: deja unos minutos para explorar.',
  'Después de la lluvia, seca bien las patas para evitar irritación.',
];

function tipOfTheDay(): string {
  const day = Math.floor(Date.now() / 86_400_000);
  return DAILY_TIPS[day % DAILY_TIPS.length];
}

type NextWalk = {
  when: string;
  petName: string;
};

type Props = {
  displayName: string;
  locationLabel: string;
  nextWalk?: NextWalk | null;
  onRequestWalk: () => void;
  onOpenPets: () => void;
  onOpenWalks: () => void;
};

export function OwnerHomeHero({
  displayName,
  locationLabel,
  nextWalk,
  onRequestWalk,
  onOpenPets,
  onOpenWalks,
}: Props) {
  return (
    <View>
      <Text style={styles.hello}>Hola, {displayName}</Text>
      <View style={styles.hero}>
        <View style={styles.pawBadge}>
          <MaterialCommunityIcons name="paw" size={18} color={theme.textLight} />
        </View>
        <Text style={styles.brand}>Bienvenido a Walkies</Text>
        <Text style={styles.tagline}>Paseos felices, perros más sanos</Text>
        <WalkingMascot />
        <TouchableOpacity style={styles.cta} onPress={onRequestWalk} activeOpacity={0.9}>
          <MaterialCommunityIcons name="dog-side" size={20} color={theme.textLight} />
          <Text style={styles.ctaText}>Solicitar un paseo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.locationRow}>
        <MaterialIcons name="location-on" size={16} color={theme.primary} />
        <Text style={styles.locationText} numberOfLines={1}>
          {locationLabel}
        </Text>
      </View>

      <View style={styles.benefits}>
        <View style={styles.benefit}>
          <MaterialCommunityIcons name="map-marker-radius" size={18} color={theme.primaryDark} />
          <Text style={styles.benefitText}>Paseadores cerca</Text>
        </View>
        <View style={styles.benefit}>
          <MaterialCommunityIcons name="clock-outline" size={18} color={theme.primaryDark} />
          <Text style={styles.benefitText}>Seguimiento</Text>
        </View>
        <View style={styles.benefit}>
          <MaterialCommunityIcons name="star-outline" size={18} color={theme.primaryDark} />
          <Text style={styles.benefitText}>Valoraciones</Text>
        </View>
      </View>

      <View style={styles.shortcuts}>
        <TouchableOpacity style={styles.shortcut} onPress={onOpenPets} activeOpacity={0.85}>
          <View style={styles.shortcutIcon}>
            <MaterialCommunityIcons name="paw" size={20} color={theme.primaryDark} />
          </View>
          <Text style={styles.shortcutTitle}>Mis mascotas</Text>
          <Text style={styles.shortcutHint}>Perfil y fotos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shortcut} onPress={onOpenWalks} activeOpacity={0.85}>
          <View style={styles.shortcutIcon}>
            <MaterialIcons name="calendar-today" size={18} color={theme.primaryDark} />
          </View>
          <Text style={styles.shortcutTitle}>Mis paseos</Text>
          <Text style={styles.shortcutHint}>Agenda e historial</Text>
        </TouchableOpacity>
      </View>

      {nextWalk ? (
        <TouchableOpacity style={styles.nextCard} onPress={onOpenWalks} activeOpacity={0.85}>
          <MaterialCommunityIcons name="clock-outline" size={22} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.nextLabel}>Próximo paseo</Text>
            <Text style={styles.nextValue}>
              {nextWalk.petName} · {nextWalk.when}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={theme.navInactive} />
        </TouchableOpacity>
      ) : null}

      <View style={styles.tipCard}>
        <MaterialCommunityIcons name="lightbulb-on-outline" size={22} color={theme.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.nextLabel}>Tip del día</Text>
          <Text style={styles.tipText}>{tipOfTheDay()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hello: {
    fontSize: 16,
    color: theme.textMuted,
    marginBottom: 8,
  },
  hero: {
    backgroundColor: theme.cardMint,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  pawBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.primaryDark,
    letterSpacing: -0.4,
  },
  tagline: {
    marginTop: 4,
    fontSize: 14,
    color: theme.textMuted,
  },
  cta: {
    marginTop: 6,
    backgroundColor: theme.primary,
    borderRadius: 999,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: theme.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ctaText: {
    color: theme.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: theme.textMuted,
  },
  benefits: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  benefit: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  benefitText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.primaryDark,
    textAlign: 'center',
  },
  shortcuts: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  shortcut: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  shortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shortcutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textDark,
  },
  shortcutHint: {
    marginTop: 2,
    fontSize: 12,
    color: theme.textMuted,
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  nextLabel: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '600',
  },
  nextValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
    color: theme.textDark,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: theme.primarySurface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  tipText: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    color: theme.textDark,
  },
});
