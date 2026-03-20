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
    <div className={`max-w-2xl ${centered ? "mx-auto text-center" : ""} mb-14`}>
      {eyebrow && (
        <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-zinc-400 text-base md:text-lg leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
