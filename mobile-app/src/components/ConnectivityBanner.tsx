import { StyleSheet, Text, View } from 'react-native';

export function ConnectivityBanner({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>📡 Sin conexión — usando solo el modelo local</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#b45309',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  text: { color: 'white', fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
