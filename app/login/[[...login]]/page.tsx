import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <SignIn routing="path" path="/login" />
    </div>
  );
}
