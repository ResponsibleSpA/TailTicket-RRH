type BadgeVariant = "light" | "solid";
type BadgeSize = "sm" | "md";
type BadgeColor =
  "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

interface BadgeProps {
  variant?: BadgeVariant; // Light or solid variant
  size?: BadgeSize; // Badge size
  color?: BadgeColor; // Badge color
  startIcon?: React.ReactNode; // Icon at the start
  endIcon?: React.ReactNode; // Icon at the end
  children: React.ReactNode; // Badge content
}

const Badge: React.FC<BadgeProps> = ({
  variant = "light",
  color = "primary",
  size = "md",
  startIcon,
  endIcon,
  children,
}) => {
  const baseStyles =
    "inline-flex items-center px-2 py-0.5 justify-center gap-1 rounded-md font-medium";

  // Define size styles
  const sizeStyles = {
    sm: "text-theme-xs", // Smaller padding and font size
    md: "text-sm", // Default padding and font size
  };

  // Define color styles for variants
  const variants = {
    light: {
      // tenui con anello sottile (docs/brand/ui.md)
      primary: "bg-brand-50 text-brand-700 ring-1 ring-brand-600/20 ring-inset dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/25",
      success: "bg-success-50 text-success-700 ring-1 ring-success-600/20 ring-inset dark:bg-success-500/10 dark:text-success-400 dark:ring-success-500/25",
      error: "bg-error-50 text-error-700 ring-1 ring-error-600/20 ring-inset dark:bg-error-500/10 dark:text-error-400 dark:ring-error-500/25",
      warning: "bg-warning-50 text-warning-700 ring-1 ring-warning-600/20 ring-inset dark:bg-warning-500/10 dark:text-warning-400 dark:ring-warning-500/25",
      info: "bg-blue-light-50 text-blue-light-700 ring-1 ring-blue-light-600/20 ring-inset dark:bg-blue-light-500/10 dark:text-blue-light-400 dark:ring-blue-light-500/25",
      light: "bg-gray-50 text-gray-700 ring-1 ring-gray-200 ring-inset dark:bg-white/5 dark:text-gray-300 dark:ring-white/10",
      dark: "bg-gray-500 text-white dark:bg-white/5 dark:text-white",
    },
    solid: {
      primary: "bg-brand-500 text-white dark:text-white",
      success: "bg-success-500 text-white dark:text-white",
      error: "bg-error-500 text-white dark:text-white",
      warning: "bg-warning-500 text-white dark:text-white",
      info: "bg-blue-light-500 text-white dark:text-white",
      light: "bg-gray-400 dark:bg-white/5 text-white dark:text-white/80",
      dark: "bg-gray-700 text-white dark:text-white",
    },
  };

  // Get styles based on size and color variant
  const sizeClass = sizeStyles[size];
  const colorStyles = variants[variant][color];

  return (
    <span className={`${baseStyles} ${sizeClass} ${colorStyles}`}>
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </span>
  );
};

export default Badge;
