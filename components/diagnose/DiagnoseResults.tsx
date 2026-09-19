"use client";

import { motion } from "framer-motion";
import BreakdownList from "@/components/diagnose/BreakdownList";
import DiagnosticPanel from "@/components/diagnose/DiagnosticPanel";
import PtsCard from "@/components/diagnose/PtsCard";
import RadarChart from "@/components/diagnose/RadarChart";
import { TiltPanel } from "@/components/diagnose/TiltPanel";
import { UniFitCard, UniMissedCard } from "@/components/diagnose/UniCards";
import type { DiagnoseResult } from "@/lib/diagnose/types";

export default function DiagnoseResults({
  result,
  runKey,
}: {
  result: DiagnoseResult;
  runKey: number;
}) {
  const total = result.calculated_scores.total_pts;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-8"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <TiltPanel>
          <PtsCard total={total} active />
          <div className="mt-6">
            <BreakdownList items={result.breakdown} total={total} />
          </div>
        </TiltPanel>

        <TiltPanel className="flex flex-col items-center justify-center">
          <RadarChart key={runKey} scores={result.radar_scores} active />
        </TiltPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3 className="text-center text-2xl font-semibold tracking-[-0.01em] text-white lg:text-left">
            Куда можно поступить с {total} PTS
          </h3>
          <div className="mt-7 grid gap-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-white/40">Подходят</p>
              <ul className="mt-3 space-y-3">
                {result.universities_fit.map((u) => (
                  <UniFitCard key={u.name} uni={u} />
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-white/40">
                Не хватает PTS
              </p>
              <ul className="mt-3 space-y-3">
                {result.universities_missed.map((u) => (
                  <UniMissedCard key={u.name} uni={u} />
                ))}
              </ul>
            </div>
          </div>
        </div>
        <DiagnosticPanel
          mainReason={result.diagnostic_text.main_reason}
          bullets={result.diagnostic_text.bullets}
        />
      </div>
    </motion.div>
  );
}
