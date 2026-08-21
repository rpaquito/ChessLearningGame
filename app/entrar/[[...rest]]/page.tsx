import { SignIn } from '@clerk/nextjs';

export default function EntrarPage() {
  return (
    <main className="min-h-dvh flex items-start justify-center p-8 pt-16">
      <SignIn />
    </main>
  );
}
