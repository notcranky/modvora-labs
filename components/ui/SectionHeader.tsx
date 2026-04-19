interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  centered = true,
}: SectionHeaderProps) {
  return (
    <div className={`max-w-2xl ${centered ? "mx-auto text-center" : ""} mb-16`}>
      {eyebrow && (
        <p className="text-zinc-600 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-[1.08] tracking-tight mb-5">
        {title}
      </h2>
      {subtitle && (
        <p className="text-zinc-400 text-base md:text-lg leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
