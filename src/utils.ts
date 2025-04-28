import parsePhoneNumberFromString, { AsYouType, type CountryCode } from 'libphonenumber-js';

import { countriesMap } from './data/countries';

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
    nationalNumber: phoneNumber.nationalNumber,
    code: phoneNumber.country,
  };
};

export const liveFormatPhoneNumber = (input: string, countryCode: CountryCode) => {
  const formatter = new AsYouType(countryCode);
  return formatter.input(input);
};
