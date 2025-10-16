export const STRINGS = {
  orderConfirmation: {
    title: 'Thank you for your purchase!',
    subtitle: 'Your order has been placed successfully.',
    orderId: 'Order ID',
    items: 'Items',
    totalPaid: 'Total Paid',
    viewOrderHistory: 'View Order History',
    backToHome: 'Back to Home',
    goHome: 'Go Home',
  },
  errors: {
    orderDetailsNotFound: 'Order details not found.',
  },
} as const;

export type AppStrings = typeof STRINGS;
