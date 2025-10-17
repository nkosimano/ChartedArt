// STUB: Facebook Analytics has been disabled for Expo Go compatibility
// The react-native-fbsdk-next package requires custom native builds
// This stub prevents build errors while maintaining the same API

const FACEBOOK_APP_ID = '2050447882394265';

class FacebookAnalytics {
  static initialize() {
    // No-op: Facebook SDK initialization disabled for Expo Go
    if (__DEV__) {
      console.log('[FacebookAnalytics] Stub mode - Facebook SDK disabled for Expo Go compatibility');
    }
  }

  static logEvent(eventName: string, parameters?: Record<string, any>) {
    // No-op: Event logging disabled for Expo Go
    if (__DEV__) {
      console.log('[FacebookAnalytics] Event:', eventName, parameters);
    }
  }

  static logPageView(pageName: string) {
    this.logEvent('PageView', { page_name: pageName });
  }

  static logPurchase(amount: number, currency: string = 'USD', parameters: Record<string, any> = {}) {
    this.logEvent('Purchase', {
      ...parameters,
      _valueToSum: amount,
      _fb_currency: currency,
    });
  }
}

export default FacebookAnalytics;
