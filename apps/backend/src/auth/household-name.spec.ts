import { householdNameFor } from './auth.service.js';

describe('householdNameFor', () => {
  it.each([
    [null, 'Mi Hogar'],
    ['   ', 'Mi Hogar'],
    ['Juan', 'Hogar de Juan'],
    ['  Ana  ', 'Hogar de Ana'],
  ])('names the Household of a User named %j as %j', (userName, expected) => {
    expect(householdNameFor(userName)).toBe(expected);
  });
});
