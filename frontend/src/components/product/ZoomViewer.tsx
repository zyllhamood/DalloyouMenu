import { IconButton, Modal, ModalContent, ModalOverlay } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

interface ZoomViewerProps {
  src: string;
  alt: string;
  onClose: () => void;
}

/**
 * Full-screen pinch / wheel zoom for a product photo. Loaded on demand and
 * built on Chakra's Modal so it stacks correctly above the quick-view sheet
 * (Escape closes the zoom first, then the sheet).
 */
export default function ZoomViewer({ src, alt, onClose }: ZoomViewerProps) {
  const { t } = useTranslation();
  return (
    <Modal isOpen onClose={onClose} size="full" motionPreset="scale">
      <ModalOverlay bg="rgba(8, 6, 5, 0.94)" backdropFilter="blur(6px)" />
      <ModalContent bg="transparent" boxShadow="none" m={0} display="grid" placeItems="center" onClick={onClose}>
        <TransformWrapper initialScale={1} minScale={1} maxScale={4} doubleClick={{ mode: 'toggle', step: 1.6 }}>
          <TransformComponent
            wrapperStyle={{ width: '100vw', height: '100dvh' }}
            contentStyle={{ width: '100vw', height: '100dvh', display: 'grid', placeItems: 'center' }}
          >
            <img
              src={src}
              alt={alt}
              onClick={(event) => event.stopPropagation()}
              style={{ maxWidth: '92vw', maxHeight: '86dvh', objectFit: 'contain', cursor: 'grab' }}
            />
          </TransformComponent>
        </TransformWrapper>
        <IconButton
          aria-label={t('product.zoomClose')}
          icon={<X size={20} />}
          onClick={onClose}
          position="fixed"
          top="calc(16px + env(safe-area-inset-top))"
          insetInlineEnd="16px"
          borderRadius="full"
          w="44px"
          h="44px"
          variant="unstyled"
          display="grid"
          placeItems="center"
          color="text.onDark"
          bg="rgba(34, 28, 22, 0.75)"
          border="1px solid rgba(227, 183, 117, 0.25)"
          _hover={{ bg: 'noir.600' }}
        />
      </ModalContent>
    </Modal>
  );
}
