import type { CountryCode } from 'libphonenumber-js';
import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, PlatformColor, StyleSheet, View } from 'react-native';
import {
  DataTable,
  IconButton,
  Modal,
  Portal,
  Searchbar,
  Text,
  TextInput,
  TouchableRipple,
} from 'react-native-paper';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isIOS } from './constants';
import { countries } from './data/countries';
import translatedCountries from './data/translatedCountries';
import type { PhoneNumberInputProps, PhoneNumberInputRef, RNPaperTextInputRef } from './types';
import { useDebouncedValue } from './use-debounced-value';
import useThemeWithFlagsFont from './useThemeWithFlagsFont';
import { getCountryByCode, liveFormatPhoneNumber } from './utils';

export const PhoneNumberInput = forwardRef<PhoneNumberInputRef, PhoneNumberInputProps>(
  (
    {
      code = '##',
      setCode,
      phoneNumber = '',
      setPhoneNumber,
      showFirstOnList,
      modalStyle,
      modalContainerStyle,
      includeCountries,
      excludeCountries,
      limitMaxLength,
      // Props from TextInput that needs special handling
      disabled,
      editable = true,
      keyboardType,
      theme,
      lang = 'fr',
      searchLabel = '',
      countryLabel = '',
      dialCodeLabel = '',
      inputRightIcon = undefined,
      // rest of the props
      ...rest
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();

    const themeWithFlagsFont = useThemeWithFlagsFont(theme);

    // States for the modal
    const [visible, setVisible] = useState(false);

    // States for the searchbar
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

    const country = getCountryByCode(code);

    const textInputRef = useRef<RNPaperTextInputRef>(null);
    const searchbarRef = useRef<RNPaperTextInputRef>(null);

    const onChangePhoneNumber = (text: string) => {
      const phoneNumber = text.split(' ').slice(2).join(' ');
      setPhoneNumber(phoneNumber);
    };

    const openModal = () => {
      setVisible(true);
      setTimeout(() => {
        searchbarRef.current?.focus();
      }, 100);
    };

    useImperativeHandle(ref, () => ({
      focus: () => textInputRef.current?.focus(),
      clear: () => textInputRef.current?.clear(),
      blur: () => textInputRef.current?.blur(),
      isFocused: () => textInputRef.current?.isFocused() ?? false,
      setNativeProps: (props) => textInputRef.current?.setNativeProps(props),
      openCountryPicker: openModal,
      closeCountryPicker: () => setVisible(false),
    }));

    const countriesList = useMemo(() => {
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

    const searchResult = useMemo(() => {
      if (!debouncedSearchQuery) {
        return countriesList;
      }

      return countriesList.filter((country) => {
        return (
          (debouncedSearchQuery.length < 3 &&
            country.code.toLocaleLowerCase().includes(debouncedSearchQuery.toLocaleLowerCase())) ||
          (debouncedSearchQuery.length < 6 &&
            Number.isInteger(Number(debouncedSearchQuery)) &&
            country.dialCode.includes(debouncedSearchQuery)) ||
          country.name.toLocaleLowerCase().includes(debouncedSearchQuery.toLocaleLowerCase())
        );
      });
    }, [debouncedSearchQuery, countriesList]);

    let width = 62;
    let baselineLength = 8;

    switch (country.dialCode.length) {
      case 1:
      case 2:
        width = 62;
        baselineLength = 8;
        break;
      case 3:
        width = 71;
        baselineLength = 9;
        break;
      case 4:
        width = 80;
        baselineLength = 10;
        break;
      case 5:
        width = 89;
        baselineLength = 11;
        break;
      default:
        width = 98;
        baselineLength = 12;
        break;
    }

    return (
      <View>
        <TextInput
          // @ts-ignore -- This type is wrong, it does not forward all the ref methods from native text input.
          ref={textInputRef}
          {...rest}
          disabled={disabled}
          editable={editable}
          onChangeText={onChangePhoneNumber}
          value={`${country.flag} ${country.dialCode} ${liveFormatPhoneNumber(
            phoneNumber,
            code as CountryCode
          )}`}
          keyboardType={keyboardType || 'phone-pad'}
          theme={themeWithFlagsFont}
          maxLength={limitMaxLength ? baselineLength + country.length : undefined}
          selectionColor={Platform.select({
            ios: PlatformColor('systemBlue') as unknown as string,
            android: PlatformColor('@android:color/holo_blue_light') as unknown as string,
          })}
          cursorColor={Platform.select({
            android: PlatformColor('@android:color/holo_blue_light') as unknown as string,
          })}
          right={inputRightIcon}
        />

        <TouchableRipple
          disabled={disabled || !editable}
          style={[styles.ripple, { width }]}
          onPress={openModal}
          theme={theme}
        >
          <Text> </Text>
        </TouchableRipple>
        <Portal theme={theme}>
          <Modal
            style={[styles.modal, modalStyle]}
            contentContainerStyle={[
              styles.countries,
              {
                backgroundColor: themeWithFlagsFont.colors.background,
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 16,
              },
              modalContainerStyle,
            ]}
            visible={visible}
            onDismiss={() => setVisible(false)}
            theme={theme}
          >
            <View style={styles.searchbox}>
              <IconButton icon="arrow-left" onPress={() => setVisible(false)} theme={theme} />
              <Searchbar
                style={styles.searchbar}
                placeholder={searchLabel}
                onChangeText={setSearchQuery}
                value={searchQuery}
                ref={searchbarRef}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Escape') {
                    setVisible(false);
                  }
                }}
                theme={theme}
                selectionColor={Platform.select({
                  ios: PlatformColor('systemBlue') as unknown as string,
                  android: PlatformColor('@android:color/holo_blue_light') as unknown as string,
                })}
              />
            </View>
            <DataTable style={styles.flex1}>
              <DataTable.Header theme={theme}>
                <DataTable.Title theme={theme}>{countryLabel}</DataTable.Title>
                <DataTable.Title numeric theme={theme}>
                  {dialCodeLabel}
                </DataTable.Title>
              </DataTable.Header>
              <FlatList
                keyboardShouldPersistTaps="handled"
                data={searchResult}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <DataTable.Row
                    onPress={() => {
                      setCode(item.code);
                      setVisible(false);
                      limitMaxLength && item.length < phoneNumber.length && setPhoneNumber('');
                    }}
                    theme={theme}
                  >
                    <DataTable.Cell theme={themeWithFlagsFont}>{`${
                      item.flag
                    }     ${translatedCountries.getName(item.code, lang)}`}</DataTable.Cell>
                    <DataTable.Cell numeric theme={theme}>
                      {item.dialCode}
                    </DataTable.Cell>
                  </DataTable.Row>
                )}
              />
            </DataTable>
          </Modal>
        </Portal>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  ripple: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  flex1: {
    flex: isIOS ? undefined : 1,
  },
  modal: {
    marginTop: undefined,
    marginBottom: undefined,
    justifyContent: undefined,
  },
  countries: {
    paddingHorizontal: 16,
    flex: isIOS ? undefined : 1,
    marginBottom: isIOS ? 270 : undefined,
    justifyContent: undefined,
  },
  searchbox: {
    flexDirection: 'row',
  },
  searchbar: {
    flex: 1,
    alignItems: 'center',
  },
});
