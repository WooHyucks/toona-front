"use client";

import { motion } from "framer-motion";

type AnalysisProgressItemProps = {
  label: string;
  active?: boolean;
  done?: boolean;
};

export function AnalysisProgressItem({
  label,
  active,
  done,
}: AnalysisProgressItemProps) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={
        done || active
          ? "text-[15px] font-medium text-foreground"
          : "text-[15px] text-muted-foreground"
      }
    >
      {label}
    </motion.span>
  );
}
