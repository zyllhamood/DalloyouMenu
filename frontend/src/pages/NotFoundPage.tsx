import { Button, HStack } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

import PageStub from '../components/PageStub';

export default function NotFoundPage() {
  return (
    <>
      <PageStub title="404" subtitle="This page doesn’t exist." />
      <HStack px={{ base: 6, md: 10 }} mt={-8} mb={16}>
        <Button as={RouterLink} to="/" variant="goldOutline">
          Back Home
        </Button>
      </HStack>
    </>
  );
}
