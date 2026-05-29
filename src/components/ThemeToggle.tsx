"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, Moon, Sun } from "lucide-react";
import { ThemeMode, useTheme } from "../contexts/ThemeContext";

const FerxxoGhostIcon = ({ size = 22 }: { size?: number }) => (
  <img
    src="/ferxxo-ghost.png"
    alt=""
    width={size}
    height={size}
    className="rounded-full object-cover"
    aria-hidden="true"
  />
);

const getThemeIcon = (theme: ThemeMode, size = 22) => {
  if (theme === "light") return <Sun size={size} />;
  if (theme === "dark") return <Moon size={size} />;

  return <FerxxoGhostIcon size={size} />;
};

const getThemeLabel = (theme: ThemeMode) => {
  if (theme === "light") return "Claro";
  if (theme === "dark") return "Oscuro";

  return "Ferxxo";
};

const options: Array<{
  id: ThemeMode;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    id: "light",
    label: "Claro",
    icon: <Sun size={18} />,
  },
  {
    id: "dark",
    label: "Oscuro",
    icon: <Moon size={18} />,
  },
  {
    id: "ferxxo",
    label: "Ferxxo",
    icon: <FerxxoGhostIcon size={22} />,
  },
];

const ThemeToggle: React.FC = () => {
  const { actualTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const isFerxxo = actualTheme === "ferxxo";
  const isDark = actualTheme === "dark";

  return (
    <div ref={wrapperRef} className="relative flex items-center justify-end">
      <div
        className={`relative flex items-center overflow-hidden rounded-2xl border backdrop-blur-2xl transition-all duration-300 ease-out ${
          isOpen ? "w-[350px] p-1" : "w-12 p-1"
        } ${
          isFerxxo
            ? "border-[#00FF66]/24 bg-[#092019]/78 shadow-[0_0_24px_rgba(0,255,102,0.20)]"
            : isDark
            ? "border-white/10 bg-slate-950/60 shadow-[0_14px_34px_rgba(0,0,0,0.32)]"
            : "border-white/70 bg-white/70 shadow-[0_14px_34px_rgba(15,23,42,0.14)]"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 active:scale-95 ${
            isFerxxo
              ? "bg-[#00C853] text-black shadow-[0_0_18px_rgba(0,200,83,0.48)]"
              : isDark
              ? "bg-white text-slate-950 shadow-lg"
              : "bg-slate-950 text-white shadow-lg"
          }`}
          aria-label={
            isOpen
              ? "Contraer selector de tema"
              : `Abrir selector de tema. Tema actual: ${getThemeLabel(
                  actualTheme
                )}`
          }
          title={getThemeLabel(actualTheme)}
        >
          <span
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              isOpen ? "scale-75 opacity-0 rotate-90" : "scale-100 opacity-100"
            }`}
          >
            {getThemeIcon(actualTheme, 20)}
          </span>

          <ChevronLeft
            size={18}
            className={`absolute transition-all duration-300 ${
              isOpen
                ? "scale-100 opacity-100 rotate-180"
                : "scale-75 opacity-0 rotate-0"
            }`}
          />
        </button>

        <div
          className={`ml-1 flex items-center gap-1 transition-all duration-300 ease-out ${
            isOpen
              ? "translate-x-0 opacity-100"
              : "translate-x-3 opacity-0 pointer-events-none"
          }`}
        >
          {options.map((option) => {
            const isActive = actualTheme === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setTheme(option.id);
                  setIsOpen(false);
                }}
                className={`group relative flex h-10 min-w-[90px] items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all duration-300 active:scale-95 ${
                  isActive
                    ? option.id === "ferxxo"
                      ? "bg-[#00C853] text-black shadow-[0_0_20px_rgba(0,200,83,0.46)]"
                      : isDark
                      ? "bg-white text-slate-950 shadow-lg"
                      : "bg-slate-950 text-white shadow-lg"
                    : isFerxxo
                    ? "text-[#BDFDD6] hover:bg-[#00FF66]/12 hover:text-[#00FF66]"
                    : isDark
                    ? "text-white/65 hover:bg-white/10 hover:text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                }`}
                aria-label={`Cambiar a modo ${option.label}`}
                title={option.label}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThemeToggle;
