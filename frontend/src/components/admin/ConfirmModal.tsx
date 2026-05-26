import {
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  body?: string;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  body,
  isLoading = false,
}: ConfirmModalProps) {
  const { t } = useTranslation('admin');
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="rgba(26,26,26,0.6)" />
      <ModalContent borderRadius="lg" border="1px solid" borderColor="border.subtle">
        <ModalHeader fontFamily="heading" fontWeight={500} fontSize="20px">
          {title ?? t('deleteConfirmTitle')}
        </ModalHeader>
        <ModalBody>
          <Text color="text.muted" fontSize="14px">
            {body ?? t('deleteConfirmBody')}
          </Text>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghostGold" size="sm" onClick={onClose} isDisabled={isLoading}>
              {t('cancel')}
            </Button>
            <Button
              size="sm"
              bg="red.600"
              color="white"
              _hover={{ bg: 'red.700' }}
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {t('delete')}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ConfirmModal;
