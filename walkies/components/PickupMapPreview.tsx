type Props = {
  latitude: number;
  longitude: number;
};

/** En iOS/web no cargamos react-native-maps; el archivo `.android.tsx` muestra el mapa. */
export function PickupMapPreview(_props: Props) {
  return null;
}
