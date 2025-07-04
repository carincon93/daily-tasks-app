import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = "light" | "dark";

const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const defaultTheme: Theme = prefersDark ? "dark" : "light";
      setTheme(defaultTheme);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  const toggleTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="z-20 fixed bottom-7 left-4">
        <button className="bg-gray-950 text-white dark:bg-white p-2 rounded-md shadow-md flex items-center justify-center dark:text-black">
          {theme === "light" ? (
            <img
              src="/daily-tasks-app/emojis/sun.png"
              alt="Light Theme"
              width={30}
            />
          ) : (
            <img
              src="/daily-tasks-app/emojis/moon.png"
              alt="Dark Theme"
              width={30}
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => toggleTheme("light")}>
          <img
            src="/daily-tasks-app/emojis/sun.png"
            alt="Light Theme"
            width={30}
          />{" "}
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggleTheme("dark")}>
          <img
            src="/daily-tasks-app/emojis/moon.png"
            alt="Dark Theme"
            width={30}
          />{" "}
          Dark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
