import { useEffect, useState } from "react";

export default function useWorkspaceTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("workspaceTheme") || "light");

  useEffect(() => {
    localStorage.setItem("workspaceTheme", theme);
  }, [theme]);

  useEffect(() => {
    const handleStorage = () => {
      setTheme(localStorage.getItem("workspaceTheme") || "light");
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return [theme, setTheme];
}
