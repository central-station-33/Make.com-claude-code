import '@testing-library/jest-dom';

declare module 'vitest' {
  interface JestMatchers<R = void, T = {}> {
    toBeInTheDocument(): R;
    toHaveTextContent(text: string): R;
    toBeVisible(): R;
  }
}