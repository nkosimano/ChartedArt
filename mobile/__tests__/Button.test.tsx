import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../src/components/common/Button';

describe('Button', () => {
  it('renders title and handles onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Tap me" onPress={onPress} />);
    const btn = getByText('Tap me');
    fireEvent.press(btn);
    expect(onPress).toHaveBeenCalled();
  });
});
