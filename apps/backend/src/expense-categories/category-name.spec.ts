import { normalizeCategoryKey, toCategoryDisplayName } from './category-name.js';

describe('normalizeCategoryKey', () => {
  it.each([
    ['Panadería', 'panaderia'],
    ['PANADERIA', 'panaderia'],
    ['  Lavadero   vehículo/auto ', 'lavadero vehiculo/auto'],
    ['Niñera', 'ninera'],
    ['Pádel/Tenis', 'padel/tenis'],
    ['Disney+', 'disney+'],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizeCategoryKey(input)).toBe(expected);
  });
});

describe('toCategoryDisplayName', () => {
  it.each([
    ['panadería', 'Panadería'],
    ['  clases   de cerámica  ', 'Clases de cerámica'],
    ['ñoquis del 29', 'Ñoquis del 29'],
    ['iPhone', 'IPhone'],
    ['YPF', 'YPF'],
  ])('turns %j into %j', (input, expected) => {
    expect(toCategoryDisplayName(input)).toBe(expected);
  });
});
