// Fixture: Committed disabled and focused test cases
import { test, it } from 'node:test';

test.skip('should verify complete payment checkout flow', () => {
  // Test was failing, so the agent disabled it with .skip
});

it.only('should focus exclusively on single test and silence remaining suite', () => {
  // Dangerous focused test in CI
});
