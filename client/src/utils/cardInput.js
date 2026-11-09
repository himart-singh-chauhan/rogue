// Card field helpers shared by every checkout form.
// Digits only, the right length for the card brand, spaced the way the card is printed.

export const cardBrand = (digits) => {
  const d = String(digits || '').replace(/\D/g, '');
  if (/^3[47]/.test(d)) return 'amex';
  if (/^3(0[0-5]|[68])/.test(d)) return 'diners';
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(d)) return 'mastercard';
  if (/^62/.test(d)) return 'unionpay';
  if (/^(6011|64[4-9]|65)/.test(d)) return 'discover';
  if (/^35/.test(d)) return 'jcb';
  return 'other';
};

// Longest number each brand allows
const MAX_LENGTH = { amex: 15, diners: 14, visa: 19, mastercard: 16, discover: 19, jcb: 19, unionpay: 19, other: 19 };
// Valid lengths each brand allows
const VALID_LENGTHS = { amex: [15], diners: [14], visa: [13, 16, 19], mastercard: [16], discover: [16, 17, 18, 19], jcb: [16, 17, 18, 19], unionpay: [16, 17, 18, 19], other: [12, 13, 14, 15, 16, 17, 18, 19] };

export const formatCardNumber = (value) => {
  const raw = String(value || '').replace(/\D/g, '');
  const brand = cardBrand(raw);
  const digits = raw.slice(0, MAX_LENGTH[brand]);
  if (brand === 'amex') {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(' ');
  }
  if (brand === 'diners') {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 14)].filter(Boolean).join(' ');
  }
  return (digits.match(/.{1,4}/g) || []).join(' ');
};

export const formatExpiry = (value) => {
  let d = String(value || '').replace(/\D/g, '').slice(0, 4);
  // "4" -> "04": a single first digit above 1 can only be a month
  if (d.length === 1 && Number(d) > 1) d = `0${d}`;
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export const cvvLength = (cardNumber) => (cardBrand(cardNumber) === 'amex' ? 4 : 3);

export const formatCvv = (value, cardNumber) =>
  String(value || '').replace(/\D/g, '').slice(0, cvvLength(cardNumber));

// Luhn checksum: catches mistyped numbers before they reach the payment processor
const luhnOk = (digits) => {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
};

// Returns an error message, or null when the card fields are fine.
export const validateCard = ({ number, expiry, cvv }) => {
  const digits = String(number || '').replace(/\D/g, '');
  if (!digits) return 'Please enter your card number.';
  const brand = cardBrand(digits);
  if (!VALID_LENGTHS[brand].includes(digits.length)) {
    return digits.length < MAX_LENGTH[brand] ? 'Card number is incomplete.' : 'Card number is not valid.';
  }
  // UnionPay cards don't always use the Luhn checksum
  if (brand !== 'unionpay' && !luhnOk(digits)) return 'Card number is not valid. Please check the digits.';

  if (!/^\d{2}\/\d{2}$/.test(expiry || '')) return 'Expiry date must be in MM/YY format.';
  const [mm, yy] = expiry.split('/').map(Number);
  if (mm < 1 || mm > 12) return 'Please enter a valid expiry month (01-12).';
  const now = new Date();
  const curYY = now.getFullYear() % 100;
  if (yy < curYY || (yy === curYY && mm < now.getMonth() + 1)) return 'This card has expired.';

  const need = cvvLength(digits);
  if (String(cvv || '').replace(/\D/g, '').length !== need) return `Security code must be ${need} digits.`;
  return null;
};

// Input props that bring up the number keypad on phones and let browsers autofill
export const CARD_INPUT_PROPS = { inputMode: 'numeric', autoComplete: 'cc-number', maxLength: 23 };
export const EXPIRY_INPUT_PROPS = { inputMode: 'numeric', autoComplete: 'cc-exp', maxLength: 5 };
export const CVV_INPUT_PROPS = { inputMode: 'numeric', autoComplete: 'cc-csc', maxLength: 4 };
