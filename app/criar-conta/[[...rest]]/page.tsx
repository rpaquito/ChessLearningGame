import { SignUp } from '@clerk/nextjs';

export default function CriarContaPage() {
  return (
    <main className="min-h-dvh flex items-start justify-center p-8 pt-16">
      <SignUp />
    </main>
  );
}
