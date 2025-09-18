import { cn } from "@/lib/utils";

interface CollectionColorDotProps {
  color: string;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  className?: string;
  onClick?: () => void;
  title?: string;
}

const colorOptions = [
  { value: "#3B82F6", name: "Blue", border: "#2563EB" },
  { value: "#10B981", name: "Green", border: "#059669" },
  { value: "#8B5CF6", name: "Purple", border: "#7C3AED" },
  { value: "#F59E0B", name: "Orange", border: "#D97706" },
  { value: "#EF4444", name: "Red", border: "#DC2626" },
  { value: "#6B7280", name: "Gray", border: "#4B5563" },
];

const getBorderColor = (mainColor: string): string => {
  const colorOption = colorOptions.find((option) => option.value === mainColor);
  return colorOption ? colorOption.border : mainColor;
};

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function CollectionColorDot({
  color,
  size = "md",
  selected = false,
  className,
  onClick,
  title,
}: CollectionColorDotProps) {
  const baseClasses =
    "rounded-full border-2 max-md:border-[1px] transition-all duration-200";
  const sizeClass = sizeClasses[size];
  const selectedClasses = selected ? "border-foreground shadow-md" : "";

  return (
    <div
      className={cn(
        baseClasses,
        sizeClass,
        selectedClasses,
        onClick && "cursor-pointer hover:scale-105",
        className
      )}
      style={{
        backgroundColor: color,
        borderColor: selected ? undefined : getBorderColor(color),
      }}
      onClick={onClick}
      title={title}
    />
  );
}

export { colorOptions, getBorderColor };
