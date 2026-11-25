import { router } from 'expo-router';

/** Back if there is history (deep links / PWA cold start may have none) – otherwise go home. */
export function goBack(fallback: Parameters<typeof router.replace>[0] = '/(tabs)') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
