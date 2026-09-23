import { BigSmallType, ColorType, OddEvenType } from '../types';

export interface NumberMetadata {
  number: number;
  bigSmall: BigSmallType;
  color: ColorType;
  oddEven: OddEvenType;
  bgGradient: string;
  textColor: string;
  badgeClass: string;
}

export const NUMBER_MAP: Record<number, NumberMetadata> = {
  0: {
    number: 0,
    bigSmall: 'Small',
    color: 'RedPurple',
    oddEven: 'Even',
    bgGradient: 'linear-gradient(135deg, #ef4444 50%, #a855f7 50%)',
    textColor: '#ffffff',
    badgeClass: 'bg-gradient-to-br from-red-500 via-rose-500 to-purple-600 text-white',
  },
  1: {
    number: 1,
    bigSmall: 'Small',
    color: 'Green',
    oddEven: 'Odd',
    bgGradient: '#10b981',
    textColor: '#ffffff',
    badgeClass: 'bg-emerald-500 text-white',
  },
  2: {
    number: 2,
    bigSmall: 'Small',
    color: 'Red',
    oddEven: 'Even',
    bgGradient: '#ef4444',
    textColor: '#ffffff',
    badgeClass: 'bg-rose-500 text-white',
  },
  3: {
    number: 3,
    bigSmall: 'Small',
    color: 'Green',
    oddEven: 'Odd',
    bgGradient: '#10b981',
    textColor: '#ffffff',
    badgeClass: 'bg-emerald-500 text-white',
  },
  4: {
    number: 4,
    bigSmall: 'Small',
    color: 'Red',
    oddEven: 'Even',
    bgGradient: '#ef4444',
    textColor: '#ffffff',
    badgeClass: 'bg-rose-500 text-white',
  },
  5: {
    number: 5,
    bigSmall: 'Big',
    color: 'GreenPurple',
    oddEven: 'Odd',
    bgGradient: 'linear-gradient(135deg, #10b981 50%, #a855f7 50%)',
    textColor: '#ffffff',
    badgeClass: 'bg-gradient-to-br from-emerald-500 via-teal-500 to-purple-600 text-white',
  },
  6: {
    number: 6,
    bigSmall: 'Big',
    color: 'Red',
    oddEven: 'Even',
    bgGradient: '#ef4444',
    textColor: '#ffffff',
    badgeClass: 'bg-rose-500 text-white',
  },
  7: {
    number: 7,
    bigSmall: 'Big',
    color: 'Green',
    oddEven: 'Odd',
    bgGradient: '#10b981',
    textColor: '#ffffff',
    badgeClass: 'bg-emerald-500 text-white',
  },
  8: {
    number: 8,
    bigSmall: 'Big',
    color: 'Red',
    oddEven: 'Even',
    bgGradient: '#ef4444',
    textColor: '#ffffff',
    badgeClass: 'bg-rose-500 text-white',
  },
  9: {
    number: 9,
    bigSmall: 'Big',
    color: 'Green',
    oddEven: 'Odd',
    bgGradient: '#10b981',
    textColor: '#ffffff',
    badgeClass: 'bg-emerald-500 text-white',
  },
};

export function getNumberMetadata(num: number): NumberMetadata {
  const normalized = Math.max(0, Math.min(9, Math.floor(num)));
  return NUMBER_MAP[normalized] || NUMBER_MAP[0];
}

export function computeAttributes(num: number): {
  bigSmall: BigSmallType;
  color: ColorType;
  oddEven: OddEvenType;
} {
  const meta = getNumberMetadata(num);
  return {
    bigSmall: meta.bigSmall,
    color: meta.color,
    oddEven: meta.oddEven,
  };
}

export function getColorCategory(color: ColorType): 'Red' | 'Green' | 'Purple' {
  if (color === 'Red' || color === 'RedPurple') return 'Red';
  if (color === 'Green' || color === 'GreenPurple') return 'Green';
  return 'Purple';
}
