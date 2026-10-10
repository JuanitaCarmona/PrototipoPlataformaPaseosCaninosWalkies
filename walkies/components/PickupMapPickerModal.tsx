export type PickupMapPickerModalProps = {
  visible: boolean;
  initialLatitude: number;
  initialLongitude: number;
  onClose: () => void;
  onConfirm: (latitude: number, longitude: number) => void;
};

/** iOS / web: sin mapa nativo; el archivo `.android.tsx` muestra el selector. */
export function PickupMapPickerModal(_props: PickupMapPickerModalProps) {
  return null;
}
