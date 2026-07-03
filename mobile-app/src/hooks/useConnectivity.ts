import { useNetInfo } from '@react-native-community/netinfo';

/**
 * `isInternetReachable` starts out `null` until the first probe resolves;
 * treat that as online so the router doesn't force local mode on cold start.
 */
export function useConnectivity(): boolean {
  const netInfo = useNetInfo();
  if (netInfo.isConnected === false) return false;
  if (netInfo.isInternetReachable === false) return false;
  return true;
}
