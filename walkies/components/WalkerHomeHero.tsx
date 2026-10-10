import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { WalkingMascot } from './WalkingMascot';

const DAILY_TIPS = [
  'Confirma pronto: los dueños suelen elegir a quien responde primero.',
  'Al llegar, manda un mensaje. Genera confianza antes de salir.',
  'Lleva bolsas y agua, aunque el dueño no lo pida.',
  'Mantén el GPS encendido todo el paseo: así el dueño te ve en el mapa.',
  'Un saludo amable al entregar a la mascota vale tanto como el recorrido.',
  'Si hay demora, avisa por el chat. La transparencia evita cancelaciones.',
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
  locationOn: boolean;
  pendingCount: number;
  inProgressCount: number;
  profileIncomplete: boolean;
  nextWalk?: NextWalk | null;
  onOpenProfile: () => void;
  onEnableLocation: () => void;
};

export function WalkerHomeHero({
  displayName,
  locationOn,
  pendingCount,
  inProgressCount,
  profileIncomplete,
  nextWalk,
  onOpenProfile,
  onEnableLocation,
}: Props) {
  return (
    <View>
      <Text style={styles.hello}>Hola, {displayName}</Text>
      <View style={styles.hero}>
        <View style={styles.pawBadge}>
          <MaterialCommunityIcons name="walk" size={18} color={theme.textLight} />
        </View>
        <Text style={styles.brand}>Listo para pasear</Text>
        <Text style={styles.tagline}>Hoy el barrio se recorre con vos</Text>
        <WalkingMascot />
        {profileIncomplete ? (
          <TouchableOpacity style={styles.cta} onPress={onOpenProfile} activeOpacity={0.9}>
            <MaterialCommunityIcons name="account-edit-outline" size={20} color={theme.textLight} />
            <Text style={styles.ctaText}>Completa tu perfil</Text>
          </TouchableOpacity>
        ) : !locationOn ? (
          <TouchableOpacity style={styles.cta} onPress={onEnableLocation} activeOpacity={0.9}>
            <MaterialIcons name="my-location" size={20} color={theme.textLight} />
            <Text style={styles.ctaText}>Activar mi ubicación</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.readyPill}>
            <MaterialCommunityIcons name="check-circle" size={18} color={theme.primary} />
            <Text style={styles.readyText}>Ubicación activa · los dueños pueden seguirte</Text>
          </View>
        )}
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Por confirmar</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{inProgressCount}</Text>
          <Text style={styles.statLabel}>En curso</Text>
        </View>
        <View style={[styles.stat, locationOn ? styles.statOk : styles.statWarn]}>
          <MaterialIcons
            name={locationOn ? 'gps-fixed' : 'gps-off'}
            size={18}
            color={locationOn ? theme.primaryDark : '#b45309'}
          />
          <Text style={[styles.statLabel, !locationOn && { color: '#b45309' }]}>
            {locationOn ? 'GPS on' : 'GPS off'}
          </Text>
        </View>
      </View>

      {!locationOn ? (
        <TouchableOpacity style={styles.alertCard} onPress={onEnableLocation} activeOpacity={0.85}>
          <View style={styles.alertIcon}>
            <MaterialIcons name="location-on" size={22} color="#b45309" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Debes tener la ubicación prendida</Text>
            <Text style={styles.alertText}>
              Sin GPS el dueño no puede ver el paseo en el mapa. Actívala antes de salir.
            </Text>
          </View>
        </TouchableOpacity>
      ) : null}

      <View style={styles.cashCard}>
        <View style={styles.cashIcon}>
          <MaterialCommunityIcons name="cash" size={22} color={theme.primaryDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cashTitle}>Pagos por ahora solo en efectivo</Text>
          <Text style={styles.cashText}>
            Recuerda cobrar al entregar a la mascota. Aún no hay pagos en la app.
          </Text>
        </View>
      </View>

      {nextWalk ? (
        <View style={styles.nextCard}>
          <MaterialCommunityIcons name="clock-outline" size={22} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.nextLabel}>Próximo paseo</Text>
            <Text style={styles.nextValue}>
              {nextWalk.petName} · {nextWalk.when}
            </Text>
          </View>
        </View>
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
  readyPill: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  readyText: {
    color: theme.primaryDark,
    fontWeight: '700',
    fontSize: 13,
    flexShrink: 1,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  statOk: {
    backgroundColor: theme.primarySurface,
  },
  statWarn: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FBD38D',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.primaryDark,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted,
    textAlign: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FBD38D',
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9a3412',
  },
  alertText: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: '#9a3412',
  },
  cashCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  cashIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.primaryDark,
  },
  cashText: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: theme.textDark,
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
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
