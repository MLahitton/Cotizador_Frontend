interface FullPageStatusProps {
  message: string;
}

export function FullPageStatus({ message }: FullPageStatusProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <p
        className="text-center text-sm font-medium text-slate-700"
        role="status"
        aria-live="polite"
      >
        {message}
      </p>
    </main>
  );
}
