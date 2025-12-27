import { GuestRoute } from "@/components/guest-route";
import { Stone, Shield, Zap, Cloud } from "lucide-react";

const features = [
  {
    icon: Cloud,
    title: "Cloud Storage",
    description: "Securely store and access your files from anywhere",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your files are encrypted and protected",
  },
  {
    icon: Zap,
    title: "Fast & Reliable",
    description: "Lightning-fast uploads and downloads",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestRoute>
      <div className="min-h-screen flex">
        {/* Left panel - branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary/5 border-r border-border/40 flex-col justify-between p-10">
          <div className="flex items-center gap-2">
            <Stone
              className="size-8 shrink-0 text-primary"
              fill="currentColor"
              strokeWidth={1.5}
              stroke="white"
            />
            <span className="text-xl font-semibold">Assets Man</span>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Manage your assets with ease
              </h1>
              <p className="text-muted-foreground text-lg">
                A simple, fast, and secure way to manage all your digital files.
              </p>
            </div>

            <div className="space-y-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Built with care for developers and teams.
          </p>
        </div>

        {/* Right panel - auth form */}
        <div className="flex-1 flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-md">
            {/* Mobile branding */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <Stone
                className="size-8 shrink-0 text-primary"
                fill="currentColor"
                strokeWidth={1.5}
                stroke="white"
              />
              <span className="text-xl font-semibold">Assets Man</span>
            </div>
            {children}
          </div>
        </div>
      </div>
    </GuestRoute>
  );
}
