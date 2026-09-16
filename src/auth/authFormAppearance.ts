import type { CustomizationOptions } from 'wasp/client/auth';

// Shared color overrides for Wasp's built-in auth forms (VerifyEmailForm,
// ForgotPasswordForm, ResetPasswordForm) so they match the LicenseDent teal/gold theme
// instead of Wasp's default yellow. Keep in sync with the CSS vars in Main.css.
export const authFormAppearance: CustomizationOptions['appearance'] = {
  colors: {
    brand: '#0F766E',
    brandAccent: '#0EA5E9',
    submitButtonText: '#ffffff',
  },
};
