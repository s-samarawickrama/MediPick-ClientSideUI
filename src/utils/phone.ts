export const normalizePhoneNumber = (value: string): string => {
  return value.replace(/[^\d+]/g, '').replace(/^00/, '+');
};

export const formatPhoneNumber = (value: string): string => {
  const digits = normalizePhoneNumber(value).replace(/\D/g, '');

  if (!digits) return '';

  if (digits.startsWith('94')) {
    const local = digits.slice(2);
    if (local.length <= 2) return `+94 ${local}`;
    if (local.length <= 5) return `+94 ${local.slice(0, 2)} ${local.slice(2)}`;
    if (local.length <= 7) {
      return `+94 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
    }
    return `+94 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7, 10)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
};

export const maskPhoneNumber = (value: string): string => {
  const normalized = normalizePhoneNumber(value);
  if (!normalized) return '';

  const digits = normalized.replace(/\D/g, '');
  if (digits.length <= 4) return '*'.repeat(digits.length);

  const visibleStart = digits.length >= 10 ? 4 : 3;
  const visibleEnd = 4;
  const masked = digits.slice(0, visibleStart).replace(/\d/g, '*') + digits.slice(visibleStart, digits.length - visibleEnd).replace(/\d/g, '*') + digits.slice(-visibleEnd);

  return masked.length > 0 ? masked : '';
};

export const isValidPhoneNumber = (value: string): boolean => {
  const normalized = normalizePhoneNumber(value);
  const regex = /^\+?94\d{9}$|^0\d{9}$/;
  return regex.test(normalized);
};
