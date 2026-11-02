import { Button } from '@repo/ui/shadcn/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-8">
      <h1 className="text-4xl font-bold text-white">ATOZ Library Admin</h1>

      <p className="mt-4 text-lg text-slate-300">Manage books, members, and borrowings.</p>

      <Button>Browse Books</Button>
    </main>
  );
}
