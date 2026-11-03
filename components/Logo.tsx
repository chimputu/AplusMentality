import Link from "next/link";

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "default" | "dark";
}

export function Logo({ className = "", showText = true, variant = "default" }: LogoProps) {
  const textColor =
    variant === "dark" ? "text-black" : "text-gray-900 dark:text-white";

  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500 text-white font-bold text-sm shadow-sm">
        A+
      </div>
      {showText && (
        <span className={`text-xl font-bold tracking-tight ${textColor}`}>
          Mentality
        </span>
      )}
    </Link>
  );
}
