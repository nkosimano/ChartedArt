export const ROUTES = {
  // Tabs
  HOME: 'Home',
  MAIN_TABS: 'MainTabs',
  
  // Orders
  ORDER_CONFIRMATION: 'OrderConfirmation',
  ORDER_HISTORY: 'OrderHistory',
  
  // Add other routes here as needed
} as const;

export type RootStackParamList = {
  [ROUTES.ORDER_CONFIRMATION]: {
    order?: {
      id: string | number;
      totalAmount: number;
      itemCount: number;
    };
  };
  [ROUTES.ORDER_HISTORY]: undefined;
  [ROUTES.MAIN_TABS]: { screen: string };
};
