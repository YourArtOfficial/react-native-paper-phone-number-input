import parsePhoneNumberFromString, { AsYouType, type CountryCode } from 'libphonenumber-js';

import { countriesMap } from './data/countries';
import translatedCountries from './data/translatedCountries';
import type { GetCountryName } from './types';

export const resolveCountryName = (
  code: string,
  lang: string,
  getCountryName?: GetCountryName
): string | undefined => getCountryName?.(code, lang) || translatedCountries.getName(code, lang);

export const getCountryByCode = (code: string = '##') => {
  const country = countriesMap[code];
  if (!country) {
    throw new Error(`Country with code ${code} not found`);
  }
  return country;
};

export const getDialCodeByCode = (code: string = '##') => {
  const country = countriesMap[code];
  if (!country) {
    throw new Error(`Country with code ${code} not found`);
  }
  return country.dialCode;
};

export const extractPhoneInfo = (input: string) => {
  const phoneNumber = parsePhoneNumberFromString(input);

  if (!phoneNumber || !phoneNumber.isValid()) {
    return { error: 'Invalid phone number' };
  }
  return {
    dialCode: phoneNumber.countryCallingCode,
    nationalNumber: phoneNumber.formatNational(),
    code: phoneNumber.country,
  };
};

export const liveFormatPhoneNumber = (input: string, countryCode: CountryCode) => {
  const formatter = new AsYouType(countryCode);
  return formatter.input(input);
};
