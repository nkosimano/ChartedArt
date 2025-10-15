import React from 'react';
import { render } from '@testing-library/react-native';
import OrderConfirmationScreen from '../src/screens/orders/OrderConfirmationScreen';

const mockNav: any = { navigate: jest.fn(), replace: jest.fn(), goBack: jest.fn() };

describe('OrderConfirmationScreen', () => {
  it('shows order summary', () => {
    const { getByText } = render(
      // @ts-ignore - route typing not needed for test
      <OrderConfirmationScreen route={{ params: { orderId: 'abc123456789', totalAmount: 99.5, itemCount: 3 } }} navigation={mockNav} />
    );

    expect(getByText(/Thank you/)).toBeTruthy();
    expect(getByText(/#abc1234567/)).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText('$99.50')).toBeTruthy();
  });
});
