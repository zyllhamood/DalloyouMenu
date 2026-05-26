import { useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Resolver } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Logo from '../../components/Logo';
import { useAuthStore } from '../../stores/authStore';
import { adminLogin } from '../../lib/api';
import { useDirection } from '../../hooks/useDirection';

interface LocationState { from?: string }

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

const FOCUS = { borderColor: 'accent.gold', boxShadow: '0 0 0 1px rgba(201,169,97,0.4)' };

export default function AdminLoginPage() {
  useDirection();
  const { t } = useTranslation('admin');
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/admin';

  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const loginStore = useAuthStore((s) => s.login);

  useEffect(() => {
    if (hydrated && token) navigate('/admin', { replace: true });
  }, [hydrated, token, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: standardSchemaResolver(schema) as Resolver<FormValues> });

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await adminLogin({ username: values.username, password: values.password });
      loginStore({ token: res.access, refreshToken: res.refresh, user: res.user });
      navigate(from, { replace: true });
    } catch {
      toast({
        title: t('loginError'),
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  return (
    <Box minH="100vh" bg="bg.canvas" display="grid" placeItems="center" px={4}>
      <Container maxW="400px">
        <Box
          bg="bg.surface"
          p={{ base: 8, md: 12 }}
          borderRadius="lg"
          border="1px solid"
          borderColor="border.subtle"
          boxShadow="soft"
        >
          <Stack spacing={8} align="center" mb={8}>
            <Logo size="md" to="/" />
            <Box textAlign="center">
              <Box h="1px" w="40px" bg="accent.gold" opacity={0.6} mx="auto" mb={4} />
              <Text fontFamily="heading" fontSize="26px" fontWeight={500}>
                {t('signIn')}
              </Text>
            </Box>
          </Stack>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={4}>
              <FormControl isInvalid={!!errors.username}>
                <FormLabel fontSize="13px" fontWeight={500}>
                  {t('username')}
                </FormLabel>
                <Input
                  type="text"
                  autoComplete="username"
                  _focus={FOCUS}
                  {...register('username')}
                />
                <FormErrorMessage fontSize="12px">{errors.username?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel fontSize="13px" fontWeight={500}>
                  {t('password')}
                </FormLabel>
                <Input
                  type="password"
                  autoComplete="current-password"
                  _focus={FOCUS}
                  {...register('password')}
                />
                <FormErrorMessage fontSize="12px">{errors.password?.message}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                bg="warm.black"
                color="accent.gold"
                border="1px solid"
                borderColor="accent.gold"
                h="48px"
                mt={2}
                isLoading={isSubmitting}
                loadingText={t('form.saving')}
                _hover={{ bg: 'accent.gold', color: 'warm.black' }}
              >
                {t('loginBtn')}
              </Button>
            </Stack>
          </form>
        </Box>
      </Container>
    </Box>
  );
}
