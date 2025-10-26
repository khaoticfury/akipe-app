"use client";

import React, { useState } from 'react';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, actualTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const themes = [
    { key: 'light' as const, icon: Sun, label: 'Claro' },
    { key: 'dark' as const, icon: Moon, label: 'Oscuro' },
    { key: 'auto' as const, icon: Monitor, label: 'Auto' },
  ];

  const currentTheme = themes.find(t => t.key === theme);

  return (
    <div className="relative">
      {/* Compact Theme Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-3 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 border-0 backdrop-blur-xl ${
          actualTheme === 'dark'
            ? 'bg-gray-800/80 text-white hover:bg-gray-700/90'
            : 'bg-white/80 text-black hover:bg-white/90'
        }`}
        aria-label="Cambiar tema"
      >
        {currentTheme && <currentTheme.icon size={18} />}
      </button>

      {/* Expanded Theme Options */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsExpanded(false)}
          />

          {/* Theme Options Panel */}
          <div className={`absolute top-full right-0 mt-2 z-50 transition-all duration-300 ${
            actualTheme === 'dark' ? 'bg-gray-800/95' : 'bg-white/95'
          } backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/20 p-2 min-w-[200px]`}>
            <div className="flex items-center gap-2 mb-3 px-2">
              <Palette size={16} className={actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} />
              <span className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Tema
              </span>
            </div>

            {themes.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => {
                  setTheme(key);
                  setIsExpanded(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                  theme === key
                    ? 'bg-black text-white shadow-md'
                    : actualTheme === 'dark'
                      ? 'text-gray-200 hover:text-white hover:bg-gray-700/50'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50/50'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{label}</span>
                {theme === key && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;
