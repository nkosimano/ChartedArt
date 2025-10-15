import '@testing-library/jest-native/extend-expect';
import { jest } from '@jest/globals';

// Silence React Native console warnings in tests
jest.spyOn(global.console, 'warn').mockImplementation(() => {});
jest.spyOn(global.console, 'error').mockImplementation(() => {});
