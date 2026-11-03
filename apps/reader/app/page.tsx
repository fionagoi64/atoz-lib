import { Button } from '@repo/ui/shadcn/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">ATOZ Library</h1>

      <p className="text-muted-foreground">Welcome to the Reader Portal</p>

      <Button>Browse Books</Button>
    </main>
  );
}
