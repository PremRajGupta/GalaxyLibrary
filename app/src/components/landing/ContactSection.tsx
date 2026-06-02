import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import type { LibraryInfo, PageText } from '../../data/landingContent';

type ContactSectionProps = {
  libraryInfo: LibraryInfo;
  pageText: PageText;
};

export default function ContactSection({ libraryInfo, pageText }: ContactSectionProps) {
  const whatsappUrl = `https://wa.me/${libraryInfo.phoneRaw}?text=${encodeURIComponent(libraryInfo.whatsappMessage)}`;

  return (
    <section id="contact" className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e293b] mb-3">{pageText.contactTitle}</h2>
          <p className="text-[#64748b]">{pageText.contactSubtitle}</p>
        </div>

        <div className="max-w-3xl mx-auto bg-[#f8fafc] rounded-2xl p-6 sm:p-10 shadow-sm border border-[#e2e8f0]">
          <h3 className="text-xl font-semibold text-[#1e293b] mb-6">{libraryInfo.ownerName}</h3>

          <div className="space-y-5 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#dbeafe] rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="text-[#3b82f6]" size={20} />
              </div>
              <div>
                <p className="text-sm text-[#64748b]">{pageText.contactPhoneLabel}</p>
                <a href={`tel:${libraryInfo.phoneRaw}`} className="text-[#1e293b] font-medium hover:text-[#3b82f6] transition-colors">
                  {libraryInfo.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#dcfce7] rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="text-[#22c55e]" size={20} />
              </div>
              <div>
                <p className="text-sm text-[#64748b]">{pageText.contactEmailLabel}</p>
                <a href={`mailto:${libraryInfo.email}`} className="text-[#1e293b] font-medium hover:text-[#3b82f6] transition-colors break-all">
                  {libraryInfo.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#fef9c3] rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="text-[#eab308]" size={20} />
              </div>
              <div>
                <p className="text-sm text-[#64748b]">{pageText.contactAddressLabel}</p>
                <p className="text-[#1e293b] font-medium">{libraryInfo.address}</p>
              </div>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-3.5 bg-[#25D366] text-white font-semibold rounded-lg hover:bg-[#20bd5a] transition-colors shadow-md"
          >
            <MessageCircle size={22} />
            {pageText.whatsappButton}
          </a>
        </div>
      </div>
    </section>
  );
}
