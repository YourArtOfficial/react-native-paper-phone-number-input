import { useMemo } from 'react';
import { countries } from '../data/countries';
import { getCountryByCode } from '../utils';

interface UseCountriesListProps {
  showFirstOnList?: string[];
  includeCountries?: string[];
  excludeCountries?: string[];
}

export const useCountriesList = ({
  showFirstOnList,
  includeCountries,
  excludeCountries,
}: UseCountriesListProps) => {
  return useMemo(() => {
    // By default, show all countries.
    let filteredCountries = countries;

    // First filter the countries based on the includeCountries.
    if (Array.isArray(includeCountries) && includeCountries.length > 0) {
      filteredCountries = includeCountries.map((code) => ({
        ...getCountryByCode(code),
        code,
      }));
    }

    // If showFirstOnList is provided, show those countries on top of the list.
    if (Array.isArray(showFirstOnList) && showFirstOnList.length > 0) {
      // If the country is not in the includeCountries, do not show it.
      // This is to prevent showing countries that are not in the includeCountries list.
      const countriesToShowOnTop = filteredCountries.filter((country) =>
        showFirstOnList.includes(country.code)
      );

      filteredCountries = countriesToShowOnTop.concat(
        // Filter out the countries that are already shown on top.
        filteredCountries.filter((country) => !showFirstOnList.includes(country.code))
      );
    }

    // If excludeCountries is provided, filter out those countries.
    if (Array.isArray(excludeCountries) && excludeCountries.length > 0) {
      filteredCountries = filteredCountries.filter(
        (country) => !excludeCountries.includes(country.code)
      );
    }

    return filteredCountries;
  }, [showFirstOnList, includeCountries, excludeCountries]);
};
