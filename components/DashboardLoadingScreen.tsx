"use client";

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import {
  loadingBar,
  loadingPulse,
  loadingScreen,
  loadingSkeleton,
  loadingStagger,
} from "@/lib/motion";
import { Skeleton } from "@/components/ui/skeleton";

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <Skeleton className={`relative overflow-hidden ${className ?? ""}`}>
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"
        aria-hidden
      />
    </Skeleton>
  );
}

export default function DashboardLoadingScreen() {
  return (
    <motion.div
      className="min-h-screen bg-muted/30 flex flex-col"
      {...loadingScreen}
    >
      <header className="border-b bg-background px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <motion.div className="flex items-center gap-3" {...loadingPulse}>
            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"
              {...loadingPulse}
            >
              <Wallet className="h-5 w-5" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <p className="text-sm font-semibold">{APP_NAME}</p>
              <p className="text-xs text-muted-foreground">
                Menyiapkan dashboard Anda…
              </p>
            </motion.div>
          </motion.div>
        </div>
        <motion.div
          className="mx-auto mt-3 h-1 max-w-5xl overflow-hidden rounded-full bg-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="h-full origin-left rounded-full bg-primary"
            {...loadingBar}
          />
        </motion.div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-5 px-4 py-5 sm:px-6">
        <motion.div
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          variants={loadingStagger}
          initial="initial"
          animate="animate"
        >
          {[0, 1, 2].map((i) => (
            <motion.div key={i} variants={loadingSkeleton}>
              <ShimmerBlock className="h-24 w-full rounded-xl" />
            </motion.div>
          ))}
        </motion.div>
        <motion.div variants={loadingSkeleton} initial="initial" animate="animate">
          <ShimmerBlock className="h-48 w-full rounded-xl" />
        </motion.div>
        <motion.div
          variants={loadingSkeleton}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
        >
          <ShimmerBlock className="h-72 w-full rounded-xl" />
        </motion.div>
      </main>
    </motion.div>
  );
}
