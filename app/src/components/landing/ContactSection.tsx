import { Clock, MapPin, MessageCircle } from 'lucide-react';
import ContactDisplay from '../shared/ContactDisplay';
import type { LibraryInfo, PageText } from '../../data/landingContent';

type ContactSectionProps = {
  libraryInfo: LibraryInfo;
  pageText: PageText;
};

export default function ContactSection({ libraryInfo, pageText }: ContactSectionProps) {
  return (
    <section id="contact" className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e293b] mb-3">{pageText.contactTitle}</h2>
          <p className="text-[#64748b]">{pageText.contactSubtitle}</p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ContactDisplay
            contact={{
              phone: libraryInfo.phone,
              phoneRaw: libraryInfo.phoneRaw,
              email: libraryInfo.email,
              address: libraryInfo.address,
              whatsappMessage: libraryInfo.whatsappMessage,
            }}
            title={libraryInfo.ownerName}
            phoneLabel={pageText.contactPhoneLabel}
            emailLabel={pageText.contactEmailLabel}
            addressLabel={pageText.contactAddressLabel}
            whatsappButtonText={pageText.whatsappButton}
          />

          <div className="bg-[#f8fafc] rounded-2xl p-6 sm:p-8 shadow-sm border border-[#e2e8f0] flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[#1e293b] mb-4">Admission & Visit Help</h3>
              <p className="text-[#64748b] leading-relaxed mb-6">
                For seat availability, fees, admission timing, or library visit details, contact us directly on WhatsApp.
              </p>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#e0f2fe] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="text-[#0284c7]" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-[#64748b]">Support</p>
                    <p className="text-[#1e293b] font-medium">Admission, fee, and seat related queries</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#fef9c3] rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-[#eab308]" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-[#64748b]">Visit Location</p>
                    <p className="text-[#1e293b] font-medium">{libraryInfo.address}</p>
                  </div>
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/${libraryInfo.phoneRaw}?text=${encodeURIComponent(libraryInfo.whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center justify-center gap-3 w-full px-8 py-3.5 bg-[#25D366] text-white font-semibold rounded-lg hover:bg-[#20bd5a] transition-colors shadow-md"
            >
              <MessageCircle size={22} />
              {pageText.whatsappButton}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
