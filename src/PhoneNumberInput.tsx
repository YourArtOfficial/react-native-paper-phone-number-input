import type { CountryCode } from 'libphonenumber-js';
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  Platform,
  PlatformColor,
  TextInput as RNTextInput,
  StyleSheet,
  View,
} from 'react-native';
import {
  DataTable,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
  TouchableRipple,
} from 'react-native-paper';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isIOS } from './constants';
import translatedCountries from './data/translatedCountries';
import { useCountriesList, useCountrySearch } from './hooks';
import type { PhoneNumberInputProps, PhoneNumberInputRef, RNPaperTextInputRef } from './types';
import { useDebouncedValue } from './use-debounced-value';
import useThemeWithFlagsFont from './useThemeWithFlagsFont';
import { getCountryByCode, liveFormatPhoneNumber } from './utils';

// Memoized country row component to prevent unnecessary re-renders
const CountryRow = memo(
  ({
    item,
    onPress,
    theme,
    themeWithFlagsFont,
    lang,
  }: {
    item: any;
    onPress: (item: any) => void;
    theme: any;
    themeWithFlagsFont: any;
    lang: string;
  }) => (
    <DataTable.Row onPress={() => onPress(item)} theme={theme}>
      <DataTable.Cell theme={themeWithFlagsFont}>{`${item.flag}     ${translatedCountries.getName(
        item.code,
        lang
      )}`}</DataTable.Cell>
      <DataTable.Cell numeric theme={theme}>
        {item.dialCode}
      </DataTable.Cell>
    </DataTable.Row>
  )
);

CountryRow.displayName = 'CountryRow';

export const PhoneNumberInput = memo(
  forwardRef<PhoneNumberInputRef, PhoneNumberInputProps>(
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
        error = false,
        errorIcon = undefined,
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

      // Memoize country calculation
      const country = useMemo(() => getCountryByCode(code), [code]);

      const textInputRef = useRef<RNPaperTextInputRef>(null);
      const searchbarRef = useRef<RNTextInput>(null);

      // Memoize phone number change handler
      const onChangePhoneNumber = useCallback(
        (text: string) => {
          const phoneNumber = text.split(' ').slice(2).join(' ');
          setPhoneNumber(phoneNumber);
        },
        [setPhoneNumber]
      );

      const openModal = useCallback(() => {
        setVisible(true);
      }, []);

      const closeModal = useCallback(() => {
        setVisible(false);
      }, []);

      // Memoize search query change handler
      const onChangeSearchQuery = useCallback((text: string) => {
        setSearchQuery(text);
      }, []);

      // Memoize country selection handler
      const onSelectCountry = useCallback(
        (item: any) => {
          setCode(item.code);
          closeModal();
          if (limitMaxLength && item.length < phoneNumber.length) {
            setPhoneNumber('');
          }
        },
        [setCode, closeModal, limitMaxLength, phoneNumber.length, setPhoneNumber]
      );

      // Memoize key press handler
      const onKeyPress = useCallback(
        ({ nativeEvent }: any) => {
          if (nativeEvent.key === 'Escape') {
            closeModal();
          }
        },
        [closeModal]
      );

      // Focus the search bar when the modal becomes visible
      useEffect(() => {
        if (visible) {
          setTimeout(() => {
            searchbarRef.current?.focus();
          }, 100);
        }
      }, [visible]);

      useImperativeHandle(
        ref,
        () => ({
          focus: () => textInputRef.current?.focus(),
          clear: () => textInputRef.current?.clear(),
          blur: () => textInputRef.current?.blur(),
          isFocused: () => textInputRef.current?.isFocused() ?? false,
          setNativeProps: (props) => textInputRef.current?.setNativeProps(props),
          openCountryPicker: openModal,
          closeCountryPicker: closeModal,
        }),
        [openModal, closeModal]
      );

      const countriesList = useCountriesList({
        showFirstOnList,
        includeCountries,
        excludeCountries,
      });

      const searchResult = useCountrySearch({
        searchQuery: debouncedSearchQuery,
        countriesList,
        lang,
      });

      // Dynamic styles based on theme
      const dynamicStyles = useMemo(
        () => ({
          searchbar: {
            flex: 1,
          },
          searchbarContent: {
            backgroundColor: 'transparent',
            fontSize: 16,
            color: theme?.colors?.onSurface || (theme?.dark ? '#ffffff' : '#000000'),
          },
          outlined: {
            borderRadius: 30,
            borderColor: theme?.dark ? '#343740' : '#CBD5E1',
          },
        }),
        [theme]
      );

      // Memoize width and baseline length calculations
      const { width, baselineLength } = useMemo(() => {
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

        return { width, baselineLength };
      }, [country.dialCode.length]);

      // Memoize the text input value
      const textInputValue = useMemo(
        () =>
          `${country.flag} ${country.dialCode} ${liveFormatPhoneNumber(
            phoneNumber,
            code as CountryCode
          )}`,
        [country.flag, country.dialCode, phoneNumber, code]
      );

      // Memoize the ripple style
      const rippleStyle = useMemo(() => [styles.ripple, { width }], [width]);

      // Memoize the modal container style
      const modalContainerStyles = useMemo(
        () => [
          styles.countries,
          {
            backgroundColor: themeWithFlagsFont.colors.background,
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
          },
          modalContainerStyle,
        ],
        [themeWithFlagsFont.colors.background, insets.top, insets.bottom, modalContainerStyle]
      );

      // Memoize FlatList renderItem function
      const renderItem = useCallback(
        ({ item }: { item: any }) => (
          <CountryRow
            item={item}
            onPress={onSelectCountry}
            theme={theme}
            themeWithFlagsFont={themeWithFlagsFont}
            lang={lang}
          />
        ),
        [onSelectCountry, theme, themeWithFlagsFont, lang]
      );

      // Memoize FlatList keyExtractor
      const keyExtractor = useCallback((item: any) => item.code, []);

      return (
        <View>
          <TextInput
            // @ts-ignore -- This type is wrong, it does not forward all the ref methods from native text input.
            ref={textInputRef}
            {...rest}
            disabled={disabled}
            editable={editable}
            onChangeText={onChangePhoneNumber}
            value={textInputValue}
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
            right={error && <TextInput.Icon icon={() => errorIcon} disabled />}
          />

          <TouchableRipple
            disabled={disabled || !editable}
            style={rippleStyle}
            onPress={openModal}
            theme={theme}
          >
            <Text> </Text>
          </TouchableRipple>
          <Portal theme={theme}>
            <Modal
              style={[styles.modal, modalStyle]}
              contentContainerStyle={modalContainerStyles}
              visible={visible}
              onDismiss={closeModal}
              theme={theme}
            >
              <View style={styles.searchbox}>
                <IconButton icon="arrow-left" onPress={closeModal} theme={theme} />
                <TextInput
                  style={[styles.searchbar, dynamicStyles.searchbar]}
                  placeholder={searchLabel}
                  onChangeText={onChangeSearchQuery}
                  value={searchQuery}
                  ref={searchbarRef}
                  mode="outlined"
                  dense
                  theme={theme}
                  onKeyPress={onKeyPress}
                  selectionColor={Platform.select({
                    ios: PlatformColor('systemBlue') as unknown as string,
                    android: PlatformColor('@android:color/holo_blue_light') as unknown as string,
                  })}
                  cursorColor={Platform.select({
                    android: PlatformColor('@android:color/holo_blue_light') as unknown as string,
                  })}
                  left={<TextInput.Icon icon="magnify" size={20} style={styles.searchIcon} />}
                  underlineStyle={styles.searchbarUnderline}
                  contentStyle={[styles.searchbarContent, dynamicStyles.searchbarContent]}
                  outlineStyle={[styles.outlined, dynamicStyles.outlined]}
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
                  keyExtractor={keyExtractor}
                  renderItem={renderItem}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  initialNumToRender={10}
                  getItemLayout={undefined}
                />
              </DataTable>
            </Modal>
          </Portal>
        </View>
      );
    }
  )
);

PhoneNumberInput.displayName = 'PhoneNumberInput';

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
  },
  searchbarContent: {
    backgroundColor: 'transparent',
  },
  searchbarUnderline: {
    display: 'none',
  },
  outlined: {
    borderRadius: 30,
  },
  searchIcon: {
    alignSelf: 'center',
    marginTop: 15,
  },
});
