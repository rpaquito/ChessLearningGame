import { SignIn } from '@clerk/nextjs';

export default function EntrarPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-8">
      <SignIn />
    </main>
  );
}
