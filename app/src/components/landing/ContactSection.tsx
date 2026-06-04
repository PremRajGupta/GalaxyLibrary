import ContactDisplay from '../shared/ContactDisplay';
import type { ContactCardInfo, LibraryInfo, PageText } from '../../data/landingContent';

type ContactSectionProps = {
  libraryInfo: LibraryInfo;
  admissionContact: ContactCardInfo;
  pageText: PageText;
};

export default function ContactSection({ libraryInfo, admissionContact, pageText }: ContactSectionProps) {
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
              mapUrl: libraryInfo.mapUrl,
              whatsappMessage: libraryInfo.whatsappMessage,
            }}
            title={libraryInfo.ownerName}
            phoneLabel={pageText.contactPhoneLabel}
            emailLabel={pageText.contactEmailLabel}
            addressLabel={pageText.contactAddressLabel}
            whatsappButtonText={pageText.whatsappButton}
          />

          <ContactDisplay
            contact={{
              phone: admissionContact.phone,
              phoneRaw: admissionContact.phoneRaw,
              email: admissionContact.email,
              address: admissionContact.address,
              mapUrl: admissionContact.mapUrl,
              whatsappMessage: admissionContact.whatsappMessage,
            }}
            title={admissionContact.title}
            phoneLabel={pageText.contactSecondPhoneLabel}
            emailLabel={pageText.contactSecondEmailLabel}
            addressLabel={pageText.contactSecondAddressLabel}
            whatsappButtonText={pageText.whatsappButton}
          />
        </div>
      </div>
    </section>
  );
}
