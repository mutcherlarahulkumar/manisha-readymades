/**
 * Admin login page.
 *
 * @module pages/admin/login
 */
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Form, Formik, type FormikHelpers } from 'formik';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { FormTextField } from '@/components/form/fields';
import { useAuth } from '@/hooks/useAuth';
import { notifyError, notifySuccess } from '@/lib/toast';
import { OUTER_SPACING } from '@/theme/spacing';
import { RADIUS, SHADOW } from '@/theme/tokens';
import { loginSchema, type LoginFormValues } from '@/validation/admin.schema';

/** Blank credentials. */
const INITIAL_VALUES: LoginFormValues = { email: '', password: '' };

/**
 * The sign-in screen for the admin dashboard.
 *
 * @returns The login page.
 */
export default function AdminLoginPage(): JSX.Element {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  // Someone who is already signed in has no business on the login screen.
  useEffect(() => {
    if (!isLoading && isAuthenticated) void router.replace('/admin');
  }, [isLoading, isAuthenticated, router]);

  async function handleSubmit(
    values: LoginFormValues,
    helpers: FormikHelpers<LoginFormValues>,
  ): Promise<void> {
    try {
      await login(values.email, values.password);
      notifySuccess('Welcome back');
      await router.replace('/admin');
    } catch (error) {
      notifyError(error, 'Could not sign you in.');
      helpers.setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: OUTER_SPACING,
        bgcolor: 'background.default',
      }}
    >
      <Head>
        <title>Sign in · Manisha Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, sm: 4 },
          width: '100%',
          maxWidth: 420,
          borderRadius: `${RADIUS.lg}px`,
          // The one card on an otherwise empty screen carries a real shadow:
          // there is nothing else for the eye to land on, so it should read as
          // a distinct object rather than an outline on a flat field.
          boxShadow: SHADOW.md,
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" color="text.secondary" component="p">
              Manisha Readymades
            </Typography>
            <Typography variant="h3" component="h1" sx={{ mt: 0.5 }}>
              Admin sign in
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Manisha Readymades dashboard
            </Typography>
          </Box>

          <Formik
            initialValues={INITIAL_VALUES}
            validationSchema={loginSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form noValidate>
                <Stack spacing={2}>
                  <FormTextField name="email" label="Email" type="email" required />
                  <FormTextField name="password" label="Password" type="password" required />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={isSubmitting}
                    sx={{ mt: 1 }}
                  >
                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                  </Button>
                </Stack>
              </Form>
            )}
          </Formik>
        </Stack>
      </Paper>
    </Box>
  );
}
