import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeUrl,
  formatWhatsAppUrl,
  isValidEmail,
  sanitizeInquiryPayload,
  sanitizeProductPayload,
  sanitizeSiteSettingsPayload,
  sanitizeDocId,
  sanitizeOrder,
} from './validation.js';

test('sanitizeUrl allows http, https, and relative paths, and blocks unsafe schemes', () => {
  assert.equal(sanitizeUrl('https://nikexports.com/img.png'), 'https://nikexports.com/img.png');
  assert.equal(sanitizeUrl('http://example.com/a'), 'http://example.com/a');
  assert.equal(sanitizeUrl('/uploads/truck.webp'), '/uploads/truck.webp');
  assert.equal(sanitizeUrl('javascript:alert(1)'), '');
  assert.equal(sanitizeUrl('data:text/html,<script>alert(1)</script>'), '');
  assert.equal(sanitizeUrl('//evil.example.com/phish'), '');
  assert.equal(sanitizeUrl('/uploads/a.png', { allowRelative: false }), '');
});

test('formatWhatsAppUrl normalizes phone numbers and preserves valid URLs', () => {
  assert.equal(formatWhatsAppUrl('+91-9216915159'), 'https://wa.me/919216915159');
  assert.equal(
    formatWhatsAppUrl('https://wa.me/919216915159', 'Hello'),
    'https://wa.me/919216915159?text=Hello'
  );
  assert.equal(formatWhatsAppUrl('javascript:alert(1)'), 'https://wa.me/919216915159');
});

test('isValidEmail validates basic email formats and rejects invalid values', () => {
  assert.equal(isValidEmail('info@nikexports.com'), true);
  assert.equal(isValidEmail('not-an-email'), false);
  assert.equal(isValidEmail('a@b'), false);
  assert.equal(isValidEmail(''), false);
});

test('sanitizeInquiryPayload validates required fields, email, and allowlists fields', () => {
  const missing = sanitizeInquiryPayload({ name: 'Alex', email: 'alex@example.com' });
  assert.ok(missing.error);

  const badEmail = sanitizeInquiryPayload({
    name: 'Alex',
    email: 'invalid',
    message: 'Need pricing',
  });
  assert.ok(badEmail.error);

  const valid = sanitizeInquiryPayload({
    name: '  Alex Buyer  ',
    email: 'alex@example.com',
    phone: '+91 9216915159',
    message: 'Quote for 5 trucks',
    product: 'Tata Prima',
    injectedAdminFlag: true,
  });
  assert.equal(valid.error, undefined);
  assert.deepEqual(valid.data, {
    name: 'Alex Buyer',
    email: 'alex@example.com',
    phone: '+91 9216915159',
    message: 'Quote for 5 trucks',
    product: 'Tata Prima',
  });
});

test('sanitizeProductPayload strips unsafe URLs, enforces limits, and allowlists keys', () => {
  const result = sanitizeProductPayload({
    name: 'Tata Prima 4028.S',
    cardImage: 'javascript:alert(1)',
    gallery: ['javascript:alert(1)', '/uploads/ok.webp'],
    specifications: [
      { label: 'Engine', value: 'Cummins' },
      { label: '', value: '' },
    ],
    extraField: 'drop-me',
  });
  assert.equal(result.error, undefined);
  assert.equal(result.data.cardImage, 'https://picsum.photos/seed/vehicle/800/600');
  assert.deepEqual(result.data.gallery, ['/uploads/ok.webp']);
  assert.equal(result.data.specifications.length, 1);
  assert.equal('extraField' in result.data, false);
});

test('sanitizeSiteSettingsPayload rejects bad email and strips unsafe social links', () => {
  const bad = sanitizeSiteSettingsPayload({ contactEmail: 'bad-email' });
  assert.ok(bad.error);

  const ok = sanitizeSiteSettingsPayload({
    contactEmail: 'info@nikexports.com',
    socialLinks: {
      whatsapp: 'javascript:alert(1)',
      facebook: 'https://facebook.com/nikexports',
    },
  });
  assert.equal(ok.error, undefined);
  assert.equal(ok.data.socialLinks.whatsapp, '');
  assert.equal(ok.data.socialLinks.facebook, 'https://facebook.com/nikexports');
});

test('sanitizeDocId and sanitizeOrder validate IDs and order bounds', () => {
  assert.equal(sanitizeDocId('prod-123_abc'), 'prod-123_abc');
  assert.equal(sanitizeDocId('../escape'), '');
  assert.equal(sanitizeOrder('3'), 3);
  assert.equal(sanitizeOrder(-1), null);
  assert.equal(sanitizeOrder(''), null);
});
