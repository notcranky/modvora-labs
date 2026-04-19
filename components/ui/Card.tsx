interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = "", hover = true }: CardProps) {
  return (
    <div
      className={`bg-[#1a1a1e] border border-[#2c2c32] rounded-2xl p-6 ${
        hover
          ? "transition-all duration-200 hover:-translate-y-1.5 hover:border-[#A020F0]/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(160,32,240,0.08)] cursor-default"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
