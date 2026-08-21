import { SignUp } from '@clerk/nextjs';

export default function CriarContaPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-8">
      <SignUp />
    </main>
  );
}
