import { ReactNode } from "react";

import { cn } from "@/utils";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "xs" | "sm" | "md"; // Button size (xs: compatto, alto come i campi da 36px)
  variant?: "primary" | "outline"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: () => void; // Click handler
  disabled?: boolean; // Disabled state
  className?: string; // Disabled state
  type?: "button" | "submit" | "reset";
  title?: string; // Tooltip (es. perché è disattivato)
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  type = "button",
  title,
}) => {
  // Size Classes
  const sizeClasses = {
    xs: "h-9 px-3 text-sm",
    sm: "h-10 px-4 text-sm",
    md: "px-5 py-3.5 text-sm",
  };

  // Variant Classes
  const variantClasses = {
    primary:
      "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/3 dark:hover:text-gray-300",
  };

  return (
    <button
      // className per ultimo (twMerge): chi usa il pulsante può cambiarne colore o dimensioni
      className={cn("inline-flex items-center justify-center gap-2 rounded-lg font-medium transition", sizeClasses[size], variantClasses[variant], disabled && "cursor-not-allowed opacity-50", className)}
      onClick={onClick}
      disabled={disabled}
      type={type}
      title={title}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
