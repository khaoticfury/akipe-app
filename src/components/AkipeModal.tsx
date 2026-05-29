"use client";

import React, { useMemo, useState } from "react";
import { Check, RotateCcw, Users, X } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

interface AkipeModalProps {
  onClose: () => void;
  onSelect: (radius: number, groupType?: string | null) => void;
  onClear?: () => void;
  currentRadius?: number | null;
  currentGroupType?: string | null;
}

const radiusOptions = [
  { value: 0.5, label: "500 m", detail: "Muy cerca" },
  { value: 1, label: "1 km", detail: "Caminable" },
  { value: 2, label: "2 km", detail: "Zona cercana" },
  { value: 5, label: "5 km", detail: "Más opciones" },
];

const groupOptions = [
  { value: "solo", label: "Solo", emoji: "🧍" },
  { value: "couple", label: "Cita", emoji: "💚" },
  { value: "family", label: "Familia", emoji: "👨‍👩‍👧" },
  { value: "large_group", label: "Grupo", emoji: "👥" },
];

const AkipeModal: React.FC<AkipeModalProps> = ({
  onClose,
  onSelect,
  onClear,
  currentRadius = null,
  currentGroupType = null,
}) => {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === "dark";
  const isFerxxo = actualTheme === "ferxxo";

  const [selectedRadius, setSelectedRadius] = useState<number>(
    currentRadius || 1
  );
  const [selectedGroupType, setSelectedGroupType] = useState<string | null>(
    currentGroupType || null
  );

  const hasActiveFilter = Boolean(currentRadius || currentGroupType);

  const selectedRadiusLabel = useMemo(() => {
    if (selectedRadius < 1) return `${selectedRadius * 1000} m`;
    return `${selectedRadius} km`;
  }, [selectedRadius]);

  const handleApply = () => {
    onSelect(selectedRadius, selectedGroupType);
  };

  const handleClear = () => {
    setSelectedRadius(1);
    setSelectedGroupType(null);
    onClear?.();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-3 sm:items-center sm:p-5">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-xl"
        aria-label="Cerrar filtro Akipe"
      />

      <div
        className={`relative w-full max-w-[460px] overflow-hidden rounded-[34px] border shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 ${
          isFerxxo
            ? "border-[#00FF66]/24 bg-[#06130F]/78 text-[#E8FFF1]"
            : isDark
            ? "border-white/10 bg-slate-950/82 text-white"
            : "border-white/80 bg-white/82 text-slate-950"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-0 ${
            isFerxxo
              ? "bg-gradient-to-br from-[#00FF66]/14 via-transparent to-[#00FF66]/5"
              : isDark
              ? "bg-gradient-to-br from-white/8 via-transparent to-blue-400/5"
              : "bg-gradient-to-br from-white/85 via-transparent to-slate-100/60"
          }`}
        />

        <div className="relative max-h-[82vh] overflow-y-auto p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div
                className={`mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                  isFerxxo
                    ? "bg-[#00FF66] text-[#06130F]"
                    : isDark
                    ? "bg-white/10 text-white"
                    : "bg-slate-950 text-white"
                }`}
              >
                <Users size={14} />
                Filtro Akipe
              </div>

              <h2 className="font-serif text-3xl font-semibold leading-tight">
                Encuentra tu zona
              </h2>
              <p
                className={`mt-1 text-sm ${
                  isDark || isFerxxo ? "text-white/58" : "text-slate-500"
                }`}
              >
                Elige un radio y Akipe resaltará los lugares dentro del círculo.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border backdrop-blur-xl transition-all active:scale-95 ${
                isFerxxo
                  ? "border-[#00FF66]/20 bg-[#00FF66]/10 text-[#00FF66]"
                  : isDark
                  ? "border-white/10 bg-white/8 text-white hover:bg-white/12"
                  : "border-white/70 bg-white/70 text-slate-900 hover:bg-white"
              }`}
              aria-label="Cerrar filtro"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-5">
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold">Distancia</h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isFerxxo
                      ? "bg-[#00FF66]/12 text-[#00FF66]"
                      : isDark
                      ? "bg-white/10 text-white/70"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {selectedRadiusLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {radiusOptions.map((option) => {
                  const active = selectedRadius === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedRadius(option.value)}
                      className={`relative rounded-[22px] border p-3 text-left transition-all active:scale-[0.98] ${
                        active
                          ? isFerxxo
                            ? "border-[#00FF66]/50 bg-[#00FF66]/15 text-[#00FF66] shadow-[0_0_22px_rgba(0,255,102,0.16)]"
                            : "border-slate-950 bg-slate-950 text-white"
                          : isFerxxo
                          ? "border-[#00FF66]/14 bg-[#00FF66]/6 text-[#E8FFF1]"
                          : isDark
                          ? "border-white/10 bg-white/7 text-white"
                          : "border-white/70 bg-white/65 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-base font-bold">
                          {option.label}
                        </span>

                        {active && <Check size={16} />}
                      </div>

                      <div
                        className={`mt-1 text-xs ${
                          active
                            ? isFerxxo
                              ? "text-[#00FF66]/80"
                              : "text-white/70"
                            : isDark || isFerxxo
                            ? "text-white/45"
                            : "text-slate-500"
                        }`}
                      >
                        {option.detail}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-bold">Plan</h3>

              <div className="grid grid-cols-4 gap-2">
                {groupOptions.map((option) => {
                  const active = selectedGroupType === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setSelectedGroupType(active ? null : option.value)
                      }
                      className={`rounded-[20px] border px-2 py-3 text-center text-xs font-semibold transition-all active:scale-[0.98] ${
                        active
                          ? isFerxxo
                            ? "border-[#00FF66]/50 bg-[#00FF66]/15 text-[#00FF66]"
                            : "border-slate-950 bg-slate-950 text-white"
                          : isFerxxo
                          ? "border-[#00FF66]/14 bg-[#00FF66]/6 text-[#E8FFF1]"
                          : isDark
                          ? "border-white/10 bg-white/7 text-white"
                          : "border-white/70 bg-white/65 text-slate-700"
                      }`}
                    >
                      <div className="text-lg">{option.emoji}</div>
                      <div className="mt-1 truncate">{option.label}</div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_1.4fr] gap-2">
            <button
              type="button"
              onClick={handleClear}
              className={`flex items-center justify-center gap-2 rounded-[22px] border px-4 py-3 text-sm font-bold transition-all active:scale-[0.98] ${
                hasActiveFilter
                  ? isFerxxo
                    ? "border-[#00FF66]/20 bg-[#00FF66]/10 text-[#00FF66]"
                    : isDark
                    ? "border-white/10 bg-white/8 text-white"
                    : "border-slate-200 bg-white/75 text-slate-800"
                  : isDark || isFerxxo
                  ? "border-white/10 bg-white/5 text-white/35"
                  : "border-slate-200 bg-white/50 text-slate-400"
              }`}
              disabled={!hasActiveFilter}
            >
              <RotateCcw size={16} />
              Limpiar
            </button>

            <button
              type="button"
              onClick={handleApply}
              className={`rounded-[22px] px-4 py-3 text-sm font-bold shadow-lg transition-all active:scale-[0.98] ${
                isFerxxo
                  ? "bg-[#00FF66] text-[#06130F] shadow-[0_0_24px_rgba(0,255,102,0.30)]"
                  : "bg-slate-950 text-white"
              }`}
            >
              Aplicar filtro
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`mt-2 w-full rounded-[20px] px-4 py-2.5 text-sm font-semibold transition-all ${
              isDark || isFerxxo
                ? "text-white/55 hover:bg-white/8"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AkipeModal;
