import React from 'react';
import { render } from '@testing-library/react-native';

// Mock AuthContext before importing component
jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ signIn: jest.fn(), loading: false }),
}));

const mockNav: any = { navigate: jest.fn() };

describe('LoginScreen', () => {
  it('renders forgot password link', () => {
    const LoginScreen = require('../src/screens/auth/LoginScreen').default;
    const { getByText } = render(<LoginScreen navigation={mockNav} />);
    expect(getByText(/Forgot password/i)).toBeTruthy();
  });
});
