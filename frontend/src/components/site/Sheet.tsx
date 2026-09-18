import type { ReactNode, Ref } from 'react';
import {
  Box,
  IconButton,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  useMediaQuery,
} from '@chakra-ui/react';
import { useDragControls, useReducedMotion, type HTMLMotionProps, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EASE_IN, EASE_OUT } from '../../lib/motion';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called once the exit animation has finished. */
  onCloseComplete?: () => void;
  label: string;
  children: ReactNode;
  /** Desktop dialog width. */
  maxW?: string;
  tone?: 'light' | 'dark';
  /** Lets the parent reset the scroll position when the content changes. */
  bodyRef?: Ref<HTMLDivElement>;
}

/**
 * One modal surface for the whole storefront: a bottom sheet with a drag
 * handle on phones, a centred dialog on larger screens. Chakra's Modal
 * provides the focus trap, Escape, scroll lock and portal; the motion is
 * ours.
 */
export function Sheet({
  isOpen,
  onClose,
  onCloseComplete,
  label,
  children,
  maxW = '560px',
  tone = 'light',
  bodyRef,
}: SheetProps) {
  const { t } = useTranslation();
  const [isDesktop] = useMediaQuery('(min-width: 48em)', { ssr: false });
  const reduce = useReducedMotion();
  const dragControls = useDragControls();

  const onDragEnd = (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 700) onClose();
  };

  const motionProps: HTMLMotionProps<'section'> = isDesktop
    ? {
        initial: { opacity: 0, y: reduce ? 0 : 28, scale: reduce ? 1 : 0.97 },
        animate: { opacity: 1, y: 0, scale: 1, transition: { duration: reduce ? 0.2 : 0.55, ease: EASE_OUT } },
        exit: { opacity: 0, y: reduce ? 0 : 16, scale: reduce ? 1 : 0.98, transition: { duration: 0.22, ease: EASE_IN } },
      }
    : {
        initial: { y: '100%' },
        animate: {
          y: 0,
          transition: reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 360, damping: 38, mass: 0.9 },
        },
        exit: { y: '100%', transition: { duration: 0.3, ease: EASE_IN } },
        drag: 'y',
        dragListener: false,
        dragControls,
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0, bottom: 0.65 },
        onDragEnd,
      };

  const dark = tone === 'dark';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onCloseComplete={onCloseComplete}
      motionPreset="none"
      isCentered={isDesktop}
      scrollBehavior="inside"
      blockScrollOnMount
      preserveScrollBarGap
    >
      <ModalOverlay bg="rgba(14, 11, 8, 0.55)" backdropFilter="blur(8px) saturate(120%)" />
      <ModalContent
        aria-label={label}
        motionProps={motionProps}
        containerProps={{ alignItems: isDesktop ? 'center' : 'flex-end', px: isDesktop ? 6 : 0 }}
        my={0}
        mx={isDesktop ? 'auto' : 0}
        w="100%"
        maxW={isDesktop ? maxW : '100%'}
        maxH={isDesktop ? 'min(90vh, 900px)' : '94svh'}
        borderRadius={isDesktop ? '28px' : '28px 28px 0 0'}
        bg={dark ? 'noir.800' : 'ivory.100'}
        color={dark ? 'text.onDark' : 'text.primary'}
        overflow="hidden"
        boxShadow="0 50px 100px -30px rgba(14, 11, 8, 0.6)"
      >
        {!isDesktop && (
          <Box
            position="absolute"
            top={0}
            insetInline={0}
            h="30px"
            zIndex={3}
            display="grid"
            placeItems="center"
            cursor="grab"
            sx={{ touchAction: 'none' }}
            onPointerDown={(event) => dragControls.start(event)}
            aria-hidden
          >
            <Box w="42px" h="5px" borderRadius="full" bg={dark ? 'rgba(244,238,227,0.28)' : 'rgba(22,18,14,0.2)'} />
          </Box>
        )}

        <IconButton
          aria-label={t('product.close')}
          icon={<X size={18} />}
          onClick={onClose}
          position="absolute"
          top={{ base: 4, md: 5 }}
          insetInlineEnd={{ base: 4, md: 5 }}
          zIndex={4}
          size="sm"
          w="38px"
          h="38px"
          borderRadius="full"
          variant="unstyled"
          display="grid"
          placeItems="center"
          bg={dark ? 'rgba(34,28,22,0.8)' : 'rgba(255,253,248,0.82)'}
          color={dark ? 'text.onDark' : 'text.primary'}
          border="1px solid"
          borderColor={dark ? 'rgba(227,183,117,0.2)' : 'rgba(22,18,14,0.08)'}
          backdropFilter="blur(10px)"
          _hover={{ bg: dark ? 'noir.600' : 'ivory.50' }}
        />

        <ModalBody
          ref={bodyRef}
          p={0}
          overflowY="auto"
          overscrollBehavior="contain"
          sx={{ scrollbarWidth: 'thin', scrollbarColor: dark ? 'rgba(227,183,117,0.25) transparent' : 'rgba(22,18,14,0.18) transparent' }}
        >
          {children}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default Sheet;
