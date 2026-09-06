import assert from 'node:assert/strict';
import test from 'node:test';
import { formatArea, formatCurrency, formatInteger, formatPercentage, formatPricePerSquareMeter } from '../../lib/utils';

test('French property values use consistent grouping and units', () => {
  assert.equal(formatCurrency(1601782), '1 601 782 MAD');
  assert.equal(formatPricePerSquareMeter(16842), '16 842 MAD/m²');
  assert.equal(formatArea(95.25), '95,3 m²');
  assert.equal(formatPercentage(14.12495), '14,1 %');
  assert.equal(formatInteger(2685), '2 685');
});

test('formatters handle invalid values and Arabic units safely', () => {
  assert.equal(formatCurrency(Number.NaN), '—');
  assert.equal(formatArea(undefined), '—');
  assert.match(formatCurrency(1601782, 'ar'), /درهم$/);
  assert.match(formatPricePerSquareMeter(16842, 'ar'), /درهم\/م²$/);
});
