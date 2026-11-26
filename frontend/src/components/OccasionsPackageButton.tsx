import { Box, Button, type ButtonProps } from '@chakra-ui/react';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { OCCASIONS_PACKAGE_URL } from '../config/links';

/** «بكج المناسبات» — the occasions package PDF (Google Drive), opened in a new tab. */
export function OccasionsPackageButton(props: ButtonProps) {
  const { t } = useTranslation();
  return (
    <Button
      as="a"
      href={OCCASIONS_PACKAGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('package.aria')}
      variant="outlineInk"
      h="50px"
      px={6}
      leftIcon={<FileText size={18} strokeWidth={1.7} />}
      {...props}
    >
      {/* A gap, not a margin: the badge is LTR, so its own "start" would face away from the label. */}
      <Box as="span" display="inline-flex" alignItems="center" gap="10px">
        {t('package.label')}
        <Box
          as="span"
          lang="en"
          dir="ltr"
          px="6px"
          py="2px"
          borderRadius="5px"
          border="1px solid currentColor"
          fontSize="10px"
          fontWeight={600}
          letterSpacing="0.08em"
          lineHeight={1.2}
          opacity={0.6}
          aria-hidden
        >
          PDF
        </Box>
      </Box>
    </Button>
  );
}

export default OccasionsPackageButton;
