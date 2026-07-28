import Image from "next/image";
import { Building2, PanelsTopLeft, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import heroImage from "@/lib/Images/Hero.jpeg";

const loginFeatures = [
  {
    title: "Acceso corporativo",
    description:
      "Autenticación mediante la cuenta de Google autorizada.",
    icon: Building2,
  },
  {
    title: "Sesión protegida",
    description:
      "El acceso se valida antes de ingresar a la plataforma.",
    icon: ShieldCheck,
  },
  {
    title: "Entorno centralizado",
    description:
      "Una experiencia preparada para organizar los procesos de cotización.",
    icon: PanelsTopLeft,
  },
];

export function LoginBrandPanel() {
  return (
    <section
      aria-labelledby="login-brand-title"
      className="relative overflow-hidden border-b border-border-subtle bg-background-subtle px-6 py-10 sm:px-10 sm:py-12 lg:flex lg:min-h-screen lg:items-center lg:border-b-0 lg:border-r lg:px-12 lg:py-16 xl:px-16"
    >
      <Image
        src={heroImage}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-background opacity-80"
      />
      <div
        aria-hidden="true"
        className="absolute right-8 top-8 h-24 w-24 border-r border-t border-border opacity-60 lg:h-32 lg:w-32"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-8 left-8 h-20 w-20 border-b border-l border-border opacity-50 lg:h-28 lg:w-28"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-1/4 top-0 hidden w-px bg-border-subtle opacity-50 lg:block"
      />

      <div className="relative mx-auto w-full max-w-xl">
        <Badge tone="brand">Plataforma interna</Badge>
        <h1
          id="login-brand-title"
          className="mt-5 max-w-lg text-3xl font-semibold leading-tight text-foreground sm:text-4xl"
        >
          Gestión de cotizaciones para Steel and Glass
        </h1>
        <p className="mt-4 max-w-lg text-base leading-7 text-foreground-secondary">
          Accede a la plataforma interna para administrar los procesos de
          cotización de la empresa.
        </p>

        <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-3 lg:grid-cols-1">
          {loginFeatures.map((feature) => {
            const Icon = feature.icon;

            return (
              <div key={feature.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-soft text-brand">
                  <Icon
                    aria-hidden="true"
                    size={18}
                    strokeWidth={1.75}
                  />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {feature.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-foreground-secondary">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
