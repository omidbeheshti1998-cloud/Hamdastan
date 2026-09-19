import { LoginFlow } from "./_login/login-flow";

export default function HomePage() {
  return (
    <main className="ambient flex flex-1 justify-center bg-zinc-50 px-5 py-12 dark:bg-black">
      {/* شعاع کارت عمداً از شعاع عناصر داخلی (rounded-xl) بزرگ‌تر است؛
          شعاع هم‌مرکز باعث می‌شود گوشه‌ها تو در تو و آرام دیده شوند. */}
      <div className="my-auto w-full max-w-sm sm:surface sm:rounded-3xl sm:border sm:border-zinc-200 sm:bg-white sm:p-8 sm:dark:border-zinc-800 sm:dark:bg-zinc-950">
        <LoginFlow />
      </div>
    </main>
  );
}
