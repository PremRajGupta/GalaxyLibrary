import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

type ContactInfo = {
  phone: string;
  phoneRaw: string;
  email: string;
  address: string;
  whatsappMessage: string;
};

type ContactDisplayProps = {
  contact: ContactInfo;
  title: string;
  subtitle?: string;
  phoneLabel: string;
  emailLabel: string;
  addressLabel: string;
  whatsappButtonText: string;
  variant?: 'default' | 'admin';
};

export default function ContactDisplay({
  contact,
  title,
  phoneLabel,
  emailLabel,
  addressLabel,
  whatsappButtonText,
  variant = 'default',
}: ContactDisplayProps) {
  const whatsappUrl = `https://wa.me/${contact.phoneRaw}?text=${encodeURIComponent(contact.whatsappMessage)}`;

  return (
    <div className={variant === 'admin' ? 'bg-[#f8fafc] rounded-xl p-6 border border-[#e2e8f0]' : 'bg-[#f8fafc] rounded-2xl p-6 sm:p-8 shadow-sm border border-[#e2e8f0]'}>
      <h3 className="text-xl font-semibold text-[#1e293b] mb-6">{title}</h3>

      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-[#dbeafe] rounded-lg flex items-center justify-center flex-shrink-0">
            <Phone className="text-[#3b82f6]" size={20} />
          </div>
          <div>
            <p className="text-sm text-[#64748b]">{phoneLabel}</p>
            <a
              href={`tel:${contact.phoneRaw}`}
              className="text-[#1e293b] font-medium hover:text-[#3b82f6] transition-colors"
            >
              {contact.phone}
            </a>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-[#dcfce7] rounded-lg flex items-center justify-center flex-shrink-0">
            <Mail className="text-[#22c55e]" size={20} />
          </div>
          <div>
            <p className="text-sm text-[#64748b]">{emailLabel}</p>
            <a
              href={`mailto:${contact.email}`}
              className="text-[#1e293b] font-medium hover:text-[#3b82f6] transition-colors break-all"
            >
              {contact.email}
            </a>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-[#fef9c3] rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin className="text-[#eab308]" size={20} />
          </div>
          <div>
            <p className="text-sm text-[#64748b]">{addressLabel}</p>
            <p className="text-[#1e293b] font-medium">{contact.address}</p>
          </div>
        </div>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center justify-center gap-3 w-full px-8 py-3.5 bg-[#25D366] text-white font-semibold rounded-lg hover:bg-[#20bd5a] transition-colors shadow-md"
      >
        <MessageCircle size={22} />
        {whatsappButtonText}
      </a>
    </div>
  );
}
