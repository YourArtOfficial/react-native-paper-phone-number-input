import React, {
  forwardRef,
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
import { countries } from './data/countries';
import translatedCountries from './data/translatedCountries';
import { useCountriesList, useCountrySearch } from './hooks';
import type { CountryPickerProps, CountryPickerRef } from './types';
import { useDebouncedValue } from './use-debounced-value';
import useThemeWithFlagsFont from './useThemeWithFlagsFont';

export const CountryPicker = forwardRef<CountryPickerRef, CountryPickerProps>(
  (
    {
      country,
      setCountry,
      showFirstOnList,
      modalStyle,
      modalContainerStyle,
      includeCountries,
      excludeCountries,
      // Prpos from TextInput that needs special handling
      disabled,
      editable = true,
      theme,
      lang = 'fr',
      placeholder = '',
      searchLabel = '',
      // rest of the props
      ...rest
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();

    const themeWithFlagsFont = useThemeWithFlagsFont(theme);

    // States for the modal
    const [visible, setVisible] = useState(false);

    const countryFlag = useMemo(() => {
      if (country) {
        const matchedCountry = countries.find(
          (c) => c.code.toLocaleLowerCase() === country.toLocaleLowerCase()
        );
        return matchedCountry?.flag;
      }
      return undefined;
    }, [country]);

    // States for the searchbar
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

    const searchbarRef = useRef<RNTextInput>(null);

    const openModal = useCallback(() => {
      setVisible(true);
    }, []);

    const closeModal = useCallback(() => {
      setVisible(false);
    }, []);

    // Focus the search bar when the modal becomes visible
    useEffect(() => {
      if (visible) {
        // We need a small delay to ensure the modal is fully animated and the search bar is rendered
        setTimeout(() => {
          searchbarRef.current?.focus();
        }, 100);
      }
    }, [visible]);

    useImperativeHandle(
      ref,
      () => ({
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

    const handleCountrySelect = useCallback(
      (selectedCountry: { code: string }) => {
        setCountry(selectedCountry.code);
        closeModal();
      },
      [setCountry, closeModal]
    );

    const renderCountryItem = useCallback(
      ({ item }: { item: any }) => (
        <DataTable.Row onPress={() => handleCountrySelect(item)} theme={theme}>
          <DataTable.Cell theme={themeWithFlagsFont}>
            {`${item.flag}     ${translatedCountries.getName(item.code, lang) || item.name}`}
          </DataTable.Cell>
        </DataTable.Row>
      ),
      [handleCountrySelect, theme, themeWithFlagsFont, lang]
    );

    const keyExtractor = useCallback((item: any) => item.code, []);

    const value = useMemo(() => {
      if (country && countryFlag) {
        return `${countryFlag} ${translatedCountries.getName(country, lang)}`;
      }

      return placeholder;
    }, [country, countryFlag, lang, placeholder]);

    // Dynamic styles based on theme
    const dynamicStyles = useMemo(
      () => ({
        searchbar: {
          flex: 1,
        },
        searchbarContent: {
          backgroundColor: 'transparent',
          fontSize: 16,
        },
        outlined: {
          borderRadius: 30,
          borderColor: theme?.dark ? '#343740' : '#CBD5E1',
        },
      }),
      [theme]
    );

    return (
      <View>
        <TextInput
          right={<TextInput.Icon icon="chevron-down" />}
          {...rest}
          disabled={disabled}
          editable={editable}
          value={value}
          theme={themeWithFlagsFont}
        />
        <TouchableRipple
          disabled={disabled || !editable}
          style={styles.ripple}
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
              ,
              modalContainerStyle,
            ]}
            visible={visible}
            onDismiss={closeModal}
            theme={theme}
          >
            <View style={styles.searchbox}>
              <IconButton icon="arrow-left" onPress={closeModal} theme={theme} />
              <TextInput
                style={[styles.searchbar, dynamicStyles.searchbar]}
                placeholder={searchLabel}
                onChangeText={setSearchQuery}
                value={searchQuery}
                ref={searchbarRef}
                mode="outlined"
                dense
                theme={theme}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Escape') {
                    closeModal();
                  }
                }}
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
              <FlatList
                keyboardShouldPersistTaps="handled"
                data={searchResult}
                keyExtractor={keyExtractor}
                renderItem={renderCountryItem}
                removeClippedSubviews={true}
                maxToRenderPerBatch={20}
                updateCellsBatchingPeriod={50}
                initialNumToRender={15}
                windowSize={10}
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
    right: 0,
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
    marginBottom: isIOS ? 150 : undefined,
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
