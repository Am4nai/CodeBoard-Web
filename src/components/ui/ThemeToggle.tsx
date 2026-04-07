import React from "react";
import { useThemeMode } from "../../utils/ThemeContext";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeMode();

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center ml-2 gap-2 px-2 py-2 rounded-lg border border-surface-lite bg-surface hover:bg-surface-lite transition-colors duration-200"
      title="Toggle theme"
    >
      <span
        className={`text-lg ${
          isDark ? "text-primary" : "text-warning"
        }`}
      >
        {isDark ? "🌙" : "☀️"}
      </span>

      <span className="text-sm text-text-secondary font-medium">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
};

export default ThemeToggle;