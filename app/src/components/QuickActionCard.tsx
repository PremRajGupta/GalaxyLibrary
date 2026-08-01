import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

interface QuickActionCardProps {
  label: string;
  icon: LucideIcon | string;
  path: string;
}

export default function QuickActionCard({ label, icon: Icon, path }: QuickActionCardProps) {
  const navigate = useNavigate();

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(path)}
      className="page-card flex flex-col items-center justify-center gap-4 hover:bg-gray-50 transition-all duration-150 py-8"
    >
      <div className="w-16 h-16 flex items-center justify-center">
        {typeof Icon === 'string' ? (
          <span className="text-[52px] leading-none drop-shadow-md">{Icon}</span>
        ) : (
          <div className="w-14 h-14 bg-[#1a2b4a] rounded-full flex items-center justify-center">
            <Icon className="text-white" size={24} />
          </div>
        )}
      </div>
      <span className="text-[15px] font-bold text-[#1e293b]">{label}</span>
    </motion.button>
  );
}
