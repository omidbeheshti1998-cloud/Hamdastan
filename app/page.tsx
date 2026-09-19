import { LoginFlow } from "./_login/login-flow";

export default function HomePage() {
  return (
    <main className="flex flex-1 justify-center bg-zinc-50 px-5 py-12 dark:bg-black">
      <div className="my-auto w-full max-w-sm sm:rounded-2xl sm:border sm:border-zinc-200 sm:bg-white sm:p-8 sm:shadow-sm sm:dark:border-zinc-800 sm:dark:bg-zinc-950">
        <LoginFlow />
      </div>
    </main>
  );
}
