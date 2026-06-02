import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Eye, Clock } from 'lucide-react';
import { loadPublicStatsForLanding, type PublicStats } from '../../lib/publicStatsService';
import type { PageText } from '../../data/landingContent';

type StatsSectionProps = {
  pageText: PageText;
};

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return undefined;
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

type StatCardProps = {
  icon: typeof Users;
  label: string;
  value: number;
  suffix?: string;
  accent: string;
};

function StatCard({ icon: Icon, label, value, suffix = '', accent }: StatCardProps) {
  const display = useCountUp(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="text-center p-6 sm:p-8 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow"
    >
      <div
        className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${accent}`}
      >
        <Icon className="text-white" size={24} />
      </div>
      <p className="text-3xl sm:text-4xl font-bold text-[#1e293b] mb-1 tabular-nums">
        {display.toLocaleString('en-IN')}
        {suffix}
      </p>
      <p className="text-sm text-[#64748b]">{label}</p>
    </motion.div>
  );
}

export default function StatsSection({ pageText }: StatsSectionProps) {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    loadPublicStatsForLanding().then(setStats);
  }, []);

  const cards = stats
    ? [
        {
          icon: Users,
          label: pageText.statsAdmissionsLabel,
          value: stats.totalAdmissions,
          accent: 'bg-[#3b82f6]',
        },
        {
          icon: Eye,
          label: pageText.statsVisitorsLabel,
          value: stats.visitorCount,
          accent: 'bg-[#22c55e]',
        },
        {
          icon: Clock,
          label: pageText.statsStudyShiftsLabel,
          value: 0,
          suffix: '',
          accent: 'bg-[#06b6d4]',
          staticText: '4h – 24h',
        },
      ]
    : [];

  return (
    <section id="stats" className="py-16 sm:py-20 bg-gradient-to-b from-[#f8fafc] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e293b] mb-3">{pageText.statsTitle}</h2>
          <p className="text-[#64748b] max-w-2xl mx-auto">{pageText.statsSubtitle}</p>
        </div>

        {!stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 sm:h-40 bg-[#e2e8f0] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {cards.map((card) =>
              'staticText' in card && card.staticText ? (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center p-6 sm:p-8 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm"
                >
                  <div
                    className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${card.accent}`}
                  >
                    <card.icon className="text-white" size={24} />
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-[#1e293b] mb-1">{card.staticText}</p>
                  <p className="text-sm text-[#64748b]">{card.label}</p>
                </motion.div>
              ) : (
                <StatCard
                  key={card.label}
                  icon={card.icon}
                  label={card.label}
                  value={card.value}
                  suffix={'suffix' in card ? card.suffix : ''}
                  accent={card.accent}
                />
              )
            )}
          </div>
        )}

        <p className="text-center text-xs text-[#94a3b8] mt-8">{pageText.statsFootnote}</p>
      </div>
    </section>
  );
}
