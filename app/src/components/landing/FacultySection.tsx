import { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';
import type { FacultyMember, PageText } from '../../data/landingContent';

type FacultySectionProps = {
  members: FacultyMember[];
  pageText: PageText;
};

function FacultyCard({ member, index }: { member: FacultyMember; index: number }) {
  const [loadFailed, setLoadFailed] = useState(false);
  const hasPhoto = Boolean(member.photo?.trim());

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="overflow-hidden rounded-xl bg-white border border-[#e2e8f0] shadow-sm hover:shadow-lg transition-shadow"
    >
      <div className="aspect-[4/3] bg-[#e2e8f0]">
        {hasPhoto && !loadFailed ? (
          <img
            src={member.photo}
            alt={member.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setLoadFailed(true)}
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-[#64748b] p-4">
            <ImageOff size={30} className="mb-2 opacity-60" />
            <span className="text-xs text-center">{loadFailed ? 'Photo failed to load' : 'No photo URL'}</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="text-lg font-bold text-[#1e293b]">{member.name}</p>
        <p className="mt-1 text-sm font-semibold text-[#3b82f6]">{member.role}</p>
        <p className="mt-3 text-sm leading-relaxed text-[#64748b]">{member.detail}</p>
      </div>
    </motion.article>
  );
}

export default function FacultySection({ members, pageText }: FacultySectionProps) {
  const visibleMembers = members.filter((member) => member.name?.trim() || member.photo?.trim());

  return (
    <section id="faculty" className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e293b] mb-3">{pageText.facultyTitle}</h2>
          <p className="text-[#64748b] max-w-2xl mx-auto">{pageText.facultySubtitle}</p>
        </div>

        {visibleMembers.length === 0 ? (
          <p className="text-center text-[#64748b] text-sm py-12">
            Faculty profiles will appear here after you add details in Website Settings.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {visibleMembers.map((member, index) => (
              <FacultyCard key={member.id} member={member} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
