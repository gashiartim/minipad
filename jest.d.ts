/// <reference types="jest" />

import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R = void> {
      toBeInTheDocument(): R
      toHaveClass(className?: string): R
    }
  }
}

export {}
