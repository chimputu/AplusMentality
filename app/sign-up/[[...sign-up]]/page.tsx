import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        appearance={{
          variables: {
            colorPrimary: 'var(--primary)',
            colorBackground: 'var(--card)',
            colorForeground: 'var(--foreground)',
            colorMutedForeground: 'var(--muted-foreground)',
            colorInput: 'var(--input)',
            colorInputForeground: 'var(--foreground)',
            colorBorder: 'var(--border)',
            colorMuted: 'var(--muted)',
          },
          elements: {
            formButtonPrimary:
              'bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors',
            card: 'bg-card border border-border shadow-lg',
            headerTitle: 'text-foreground',
            headerSubtitle: 'text-muted-foreground',
            formFieldLabel: 'text-foreground',
            formFieldInput: 'bg-input text-foreground border-border focus:border-primary',
            formFieldInputShowPasswordButton: 'text-muted-foreground hover:text-foreground',
            formResendCodeLink: 'text-primary hover:text-primary-hover',
            formLink: 'text-primary hover:text-primary-hover',
            dividerLine: 'border-border',
            dividerText: 'text-muted-foreground',
            socialButtonsBlockButton: 'bg-card border-border text-foreground hover:bg-muted',
            footerActionText: 'text-muted-foreground',
            footerActionLink: 'text-primary hover:text-primary-hover',
          },
        }}
      />
    </div>
  );
}
