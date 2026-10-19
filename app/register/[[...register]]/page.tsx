import { SignUp } from '@clerk/nextjs';

export default function RegisterPage() {
  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <SignUp routing="path" path="/register" />
    </div>
  );
}
