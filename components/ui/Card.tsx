interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = "", hover = true }: CardProps) {
  return (
    <div
      className={`bg-[#16161a] border border-[#2a2a30] rounded-xl p-6 ${
        hover ? "card-hover cursor-default" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
