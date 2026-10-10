import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
};

export function StarRating({ value, onChange, size = 26 }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const icon = (
          <MaterialCommunityIcons
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? '#F5B301' : '#8AA093'}
          />
        );
        if (!onChange) {
          return <View key={n}>{icon}</View>;
        }
        return (
          <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={6}>
            {icon}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
