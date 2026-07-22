"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/auth-context";
import { ProtectedRoute } from "@/features/auth/protected-route";

function DashboardContent() {
  const router = useRouter();
  const { signOut, user } = useAuth();

  if (!user) {
    return null;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((name) => name?.charAt(0).toUpperCase())
    .join("");

  const handleSignOut = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-950">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Esta es una vista provisional del cotizador.
        </p>

        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">
          {user.profilePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="h-16 w-16 rounded-full object-cover"
              src={user.profilePictureUrl}
              alt={`Fotografía de ${fullName}`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700"
              aria-hidden="true"
            >
              {initials}
            </div>
          )}
          <div>
            <p className="font-medium text-slate-950">{fullName}</p>
            <p className="mt-1 break-all text-sm text-slate-600">{user.email}</p>
            <p className="mt-2 text-sm font-medium text-emerald-700">
              Sesión activa
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-8 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
