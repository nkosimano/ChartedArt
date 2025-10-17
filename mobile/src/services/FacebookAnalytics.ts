import { Settings } from 'react-native-fbsdk-next';

const FACEBOOK_APP_ID = '2050447882394265';

class FacebookAnalytics {
  static initialize() {
    // Initialize Facebook SDK
    Settings.initializeSDK();
    Settings.setAppID(FACEBOOK_APP_ID);
    Settings.setAutoLogAppEventsEnabled(true);
    Settings.setAdvertiserIDCollectionEnabled(true);
    Settings.setAdvertiserTrackingEnabled(true);
  }

  static logEvent(eventName: string, parameters?: Record<string, any>) {
    import('react-native-fbsdk-next').then(({ AppEventsLogger }) => {
      if (parameters) {
        AppEventsLogger.logEvent(eventName, parameters);
      } else {
        AppEventsLogger.logEvent(eventName);
      }
    });
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
