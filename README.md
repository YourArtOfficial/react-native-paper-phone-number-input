# React Native Paper Phone Number Input

This package is a customized fork of [react-native-paper-phone-number-input](https://github.com/kuasha420/react-native-paper-phone-number-input), originally designed to handle phone number and country picker inputs in React Native using React Native Paper components.

We've enhanced the original project with additional features to better suit the needs of **ArtMajeur**, including internationalization and extended functionality.

---

## ✨ Key Improvements

- 🌍 Added country name translations using the `i18n-iso-countries` library.
- 📦 Country code is now returned when a user selects a country.

---

## 📦 Installation

Install the package via your preferred package manager:

**Using Yarn:**

```bash
yarn add @artmajeur/react-native-paper-phone-number-input
```

**Using NPM:**

```bash
npm install @artmajeur/react-native-paper-phone-number-input
```

---

## 🌐 Custom Country Names (`getCountryName`)

By default, country names come from `i18n-iso-countries`, whose data has some errors (for example, Portuguese swaps the two Congos). Both `PhoneNumberInput` and `CountryPicker` accept an optional `getCountryName` prop to supply your own names. It is used for the displayed names, the selected value, and search and sorting in the picker.

```ts
getCountryName?: (code: string, lang: string) => string | undefined;
```

`code` is the uppercase ISO 3166-1 alpha-2 country code (e.g. `"CD"`) and `lang` is the `lang` prop. Return `undefined` (or an empty string) to fall back to the `i18n-iso-countries` name. The function is called during render and while sorting search results, so it must not throw and should be fast.

Example using CLDR names via `Intl.DisplayNames`:

```tsx
import { CountryPicker } from '@artmajeur/react-native-paper-phone-number-input';

const displayNamesByLang = new Map<string, Intl.DisplayNames>();

const getCountryName = (code: string, lang: string) => {
  // Hermes may not implement Intl.DisplayNames.
  if (typeof Intl.DisplayNames !== 'function') {
    return undefined;
  }
  try {
    let displayNames = displayNamesByLang.get(lang);
    if (!displayNames) {
      // fallback: 'none' returns undefined for unknown codes instead of echoing the code.
      displayNames = new Intl.DisplayNames([lang], { type: 'region', fallback: 'none' });
      displayNamesByLang.set(lang, displayNames);
    }
    return displayNames.of(code);
  } catch {
    return undefined;
  }
};

<CountryPicker
  country={country}
  setCountry={setCountry}
  lang="pt"
  getCountryName={getCountryName}
/>;
```

Pass a stable function (defined outside the component or wrapped in `useCallback`) so the country list is not recomputed on every render.

---

## 🚀 Publishing a New Version

To update and publish a new version of the package:

1. Make your changes in the repository.
2. Update the version number in the `package.json` file.
3. Run the following command to publish:

```bash
npm publish
```

---
