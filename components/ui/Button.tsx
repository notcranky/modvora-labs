import Link from "next/link";

interface ButtonProps {
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export default function Button({
  href,
  onClick,
  variant = "primary",
  size = "md",
  children,
  className = "",
  type = "button",
  disabled,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-purple-600 hover:bg-purple-500 text-white purple-glow-sm",
    outline:
      "border border-purple-600 text-purple-400 hover:bg-purple-600/10 hover:border-purple-400",
    ghost:
      "text-zinc-400 hover:text-white hover:bg-white/5",
  };

  const sizes = {
    sm: "text-sm px-4 py-2",
    md: "text-sm px-5 py-2.5",
    lg: "text-base px-7 py-3.5",
  };

  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes} disabled={disabled}>
      {children}
    </button>
  );
}
