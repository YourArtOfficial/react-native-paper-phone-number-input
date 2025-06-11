import { useMemo } from 'react';
import translatedCountries from '../data/translatedCountries';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  length: number;
}

interface UseCountrySearchProps {
  searchQuery: string;
  countriesList: Country[];
  lang: string;
}

export const useCountrySearch = ({ searchQuery, countriesList, lang }: UseCountrySearchProps) => {
  return useMemo(() => {
    if (!searchQuery) {
      return countriesList;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();

    const filteredAndSorted = countriesList
      .map((country) => {
        const translatedName =
          translatedCountries.getName(country.code, lang)?.toLowerCase() ||
          country.name.toLowerCase();
        const lowerCaseCode = country.code.toLowerCase();
        const dialCode = country.dialCode;

        let score = 0;
        if (lowerCaseCode === lowerCaseQuery) {
          score = 5; // Exact code match
        } else if (dialCode.includes(lowerCaseQuery)) {
          score = 4; // Dial code match
        } else if (translatedName.startsWith(lowerCaseQuery)) {
          score = 3; // Translated name prefix match
        } else if (lowerCaseCode.startsWith(lowerCaseQuery)) {
          score = 2; // Code prefix match
        } else if (translatedName.includes(lowerCaseQuery)) {
          score = 1; // Translated name inclusion match
        }

        return { ...country, score };
      })
      .filter((country) => country.score > 0)
      .sort((a, b) => {
        if (a.score !== b.score) {
          return b.score - a.score;
        }
        const translatedA = translatedCountries.getName(a.code, lang) || a.name;
        const translatedB = translatedCountries.getName(b.code, lang) || b.name;
        return translatedA.localeCompare(translatedB);
      });

    return filteredAndSorted;
  }, [searchQuery, countriesList, lang]);
};
