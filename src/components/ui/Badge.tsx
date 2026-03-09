import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "green" | "yellow" | "red" | "gray" | "blue";
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = "gray",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variant === "green" && "bg-green-100 text-green-800",
        variant === "yellow" && "bg-yellow-100 text-yellow-800",
        variant === "red" && "bg-red-100 text-red-800",
        variant === "gray" && "bg-gray-100 text-gray-700",
        variant === "blue" && "bg-blue-100 text-blue-800",
        className
      )}
    >
      {children}
    </span>
  );
}
