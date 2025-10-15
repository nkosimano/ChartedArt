import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export async function openExternal(url: string) {
  try {
    const result = await WebBrowser.openBrowserAsync(url, {
      presentationStyle: Platform.OS === 'ios' ? WebBrowser.WebBrowserPresentationStyle.POPOVER : undefined,
      enableBarCollapsing: true,
      showTitle: true,
      toolbarColor: '#ffffff',
      secondaryToolbarColor: '#f2f2f2',
      controlsColor: '#111111',
    } as any);
    return result;
  } catch (e) {
    // Fallback: try to open using Linking
    const { Linking } = await import('react-native');
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    }
  }
}
