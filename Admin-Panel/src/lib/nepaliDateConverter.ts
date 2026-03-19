// Nepali Date Converter Utility
// Converts between AD (Gregorian) and BS (Bikram Sambat) dates

interface NepaliDate {
  year: number;
  month: number;
  day: number;
}

interface GregorianDate {
  year: number;
  month: number; // 0-11
  day: number;
}

// Nepali calendar data - mapping AD dates to BS dates
// This is a simplified version. For production, use a comprehensive library
const NEPALI_CALENDAR_DATA: Record<number, number[]> = {
  2000: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2001: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2002: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2003: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2004: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2005: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2006: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2007: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2008: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2009: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2010: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2011: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2012: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2013: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2014: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2015: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2016: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2017: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2018: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2019: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2020: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2021: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2022: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2023: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2024: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2025: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2026: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
};

const NEPALI_MONTH_NAMES = [
  'बैशाख', 'जेष्ठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
  'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
];

const NEPALI_MONTH_NAMES_EN = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

const ENGLISH_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const NEPALI_DAYS = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'];

// Reference date: April 13, 2000 AD = Baisakh 1, 2057 BS
const REFERENCE_AD = new Date(2000, 3, 13); // Month is 0-indexed
const REFERENCE_BS: NepaliDate = { year: 2057, month: 0, day: 1 };

export function adToBs(date: Date): NepaliDate {
  const diffTime = date.getTime() - REFERENCE_AD.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  let bsYear = REFERENCE_BS.year;
  let bsMonth = REFERENCE_BS.month;
  let bsDay = REFERENCE_BS.day;
  let daysRemaining = diffDays;

  while (daysRemaining > 0) {
    const daysInMonth = NEPALI_CALENDAR_DATA[bsYear]?.[bsMonth] || 30;
    if (bsDay + daysRemaining > daysInMonth) {
      daysRemaining -= (daysInMonth - bsDay + 1);
      bsDay = 1;
      bsMonth++;
      if (bsMonth >= 12) {
        bsMonth = 0;
        bsYear++;
      }
    } else {
      bsDay += daysRemaining;
      daysRemaining = 0;
    }
  }

  while (daysRemaining < 0) {
    bsDay--;
    if (bsDay < 1) {
      bsMonth--;
      if (bsMonth < 0) {
        bsMonth = 11;
        bsYear--;
      }
      const daysInMonth = NEPALI_CALENDAR_DATA[bsYear]?.[bsMonth] || 30;
      bsDay = daysInMonth;
    }
    daysRemaining++;
  }

  return { year: bsYear, month: bsMonth, day: bsDay };
}

export function bsToAd(bsDate: NepaliDate): Date {
  let totalDays = 0;
  let currentBsYear = REFERENCE_BS.year;
  let currentBsMonth = REFERENCE_BS.month;
  let currentBsDay = REFERENCE_BS.day;

  // Calculate days from reference date to target BS date
  while (
    currentBsYear < bsDate.year ||
    (currentBsYear === bsDate.year && currentBsMonth < bsDate.month) ||
    (currentBsYear === bsDate.year && currentBsMonth === bsDate.month && currentBsDay < bsDate.day)
  ) {
    const daysInMonth = NEPALI_CALENDAR_DATA[currentBsYear]?.[currentBsMonth] || 30;
    if (currentBsDay < daysInMonth) {
      currentBsDay++;
      totalDays++;
    } else {
      currentBsDay = 1;
      currentBsMonth++;
      if (currentBsMonth >= 12) {
        currentBsMonth = 0;
        currentBsYear++;
      }
    }
  }

  // Calculate days from reference date backwards if needed
  while (
    currentBsYear > bsDate.year ||
    (currentBsYear === bsDate.year && currentBsMonth > bsDate.month) ||
    (currentBsYear === bsDate.year && currentBsMonth === bsDate.month && currentBsDay > bsDate.day)
  ) {
    currentBsDay--;
    totalDays--;
    if (currentBsDay < 1) {
      currentBsMonth--;
      if (currentBsMonth < 0) {
        currentBsMonth = 11;
        currentBsYear--;
      }
      const daysInMonth = NEPALI_CALENDAR_DATA[currentBsYear]?.[currentBsMonth] || 30;
      currentBsDay = daysInMonth;
    }
  }

  const resultDate = new Date(REFERENCE_AD);
  resultDate.setDate(resultDate.getDate() + totalDays);
  return resultDate;
}

export function getNepaliMonthName(month: number, inEnglish = false): string {
  if (month < 0 || month >= 12) return '';
  return inEnglish ? NEPALI_MONTH_NAMES_EN[month] : NEPALI_MONTH_NAMES[month];
}

export function getNepaliDayName(dayIndex: number, inEnglish = false): string {
  if (dayIndex < 0 || dayIndex >= 7) return '';
  return inEnglish ? ENGLISH_DAYS[dayIndex] : NEPALI_DAYS[dayIndex];
}

export function formatNepaliDate(date: Date, inEnglish = false): string {
  const bs = adToBs(date);
  const monthName = getNepaliMonthName(bs.month, inEnglish);
  return `${bs.day} ${monthName}, ${bs.year} BS`;
}

export function getDaysInNepaliMonth(year: number, month: number): number {
  return NEPALI_CALENDAR_DATA[year]?.[month] || 30;
}

export { type NepaliDate, type GregorianDate };
