"use client";

import { Code2, HardDrive, Lock, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const stats = [
  { icon: Code2, label: "Open Source" },
  { icon: Server, label: "Self-hosted" },
  { icon: HardDrive, label: "S3 Compatible" },
  { icon: Lock, label: "Privacy First" },
];

interface StatsSectionProps {
  className?: string;
}

export function StatsSection({ className }: StatsSectionProps) {
  return (
    <section className={cn(className)}>
      <motion.div
        className="mx-auto max-w-6xl px-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 md:gap-x-12">
          {stats.map((stat, index) => (
            <div key={stat.label} className="flex items-center gap-3">
              {index > 0 && (
                <div className="hidden md:block h-4 w-px bg-border -ml-4 md:-ml-6 mr-4 md:mr-6" />
              )}
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
