/**
 * Thin wrapper around Chakra FormControl that applies gold-focus styles
 * and a subtle gold-tinted error background.
 */
import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Textarea,
} from '@chakra-ui/react';
import type { ReactNode } from 'react';

const FOCUS_STYLES = {
  borderColor: 'accent.gold',
  boxShadow: '0 0 0 1px rgba(201,169,97,0.4)',
};

const ERROR_STYLES = {
  bg: 'rgba(201,169,97,0.06)',
  borderColor: 'red.400',
};

interface BaseProps {
  label: string;
  error?: string;
  helper?: string;
  isRequired?: boolean;
}

export function TextField({
  label,
  error,
  helper,
  isRequired,
  ...rest
}: BaseProps & React.ComponentProps<typeof Input>) {
  return (
    <FormControl isInvalid={!!error} isRequired={isRequired}>
      <FormLabel fontSize="13px" fontWeight={500} mb={1}>
        {label}
      </FormLabel>
      <Input
        size="sm"
        borderRadius="sm"
        _focus={FOCUS_STYLES}
        {...(error ? ERROR_STYLES : {})}
        {...rest}
      />
      {helper && !error && <FormHelperText fontSize="11px">{helper}</FormHelperText>}
      {error && (
        <FormErrorMessage fontSize="11px" color="red.500">
          {error}
        </FormErrorMessage>
      )}
    </FormControl>
  );
}

export function TextareaField({
  label,
  error,
  helper,
  isRequired,
  ...rest
}: BaseProps & React.ComponentProps<typeof Textarea>) {
  return (
    <FormControl isInvalid={!!error} isRequired={isRequired}>
      <FormLabel fontSize="13px" fontWeight={500} mb={1}>
        {label}
      </FormLabel>
      <Textarea
        size="sm"
        borderRadius="sm"
        rows={3}
        _focus={FOCUS_STYLES}
        {...(error ? ERROR_STYLES : {})}
        {...rest}
      />
      {helper && !error && <FormHelperText fontSize="11px">{helper}</FormHelperText>}
      {error && (
        <FormErrorMessage fontSize="11px" color="red.500">
          {error}
        </FormErrorMessage>
      )}
    </FormControl>
  );
}

export function NumberField({
  label,
  error,
  helper,
  isRequired,
  min = 0,
  value,
  onChange,
}: BaseProps & { min?: number; value: number; onChange: (v: number) => void }) {
  return (
    <FormControl isInvalid={!!error} isRequired={isRequired}>
      <FormLabel fontSize="13px" fontWeight={500} mb={1}>
        {label}
      </FormLabel>
      <NumberInput
        size="sm"
        min={min}
        value={value}
        onChange={(_, n) => onChange(Number.isNaN(n) ? 0 : n)}
      >
        <NumberInputField
          borderRadius="sm"
          _focus={FOCUS_STYLES}
          {...(error ? ERROR_STYLES : {})}
        />
      </NumberInput>
      {helper && !error && <FormHelperText fontSize="11px">{helper}</FormHelperText>}
      {error && (
        <FormErrorMessage fontSize="11px" color="red.500">
          {error}
        </FormErrorMessage>
      )}
    </FormControl>
  );
}

export function FieldWrapper({
  label,
  error,
  helper,
  isRequired,
  children,
}: BaseProps & { children: ReactNode }) {
  return (
    <FormControl isInvalid={!!error} isRequired={isRequired}>
      <FormLabel fontSize="13px" fontWeight={500} mb={1}>
        {label}
      </FormLabel>
      {children}
      {helper && !error && <FormHelperText fontSize="11px">{helper}</FormHelperText>}
      {error && (
        <FormErrorMessage fontSize="11px" color="red.500">
          {error}
        </FormErrorMessage>
      )}
    </FormControl>
  );
}
