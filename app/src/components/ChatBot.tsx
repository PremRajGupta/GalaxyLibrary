import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Bot,
  User,
  Sparkles,
  MessageCircle,
  ArrowUp,
  RotateCcw,
  ChevronRight,
  Monitor,
  IndianRupee,
  Clock,
  MapPin,
  Phone,
  Wifi,
  FileText,
  ExternalLink,
  ArrowLeft,
  Sun,
  ShieldCheck,
  CheckCircle2,
  Menu,
} from 'lucide-react';
import { loadSiteContent } from '../lib/siteContentService';
import { DEFAULT_SITE_CONTENT, type SiteContent, type ComputerCourse } from '../data/landingContent';

interface ActionBtn {
  label: string;
  path?: string;
  url?: string;
}

interface Message {
  text: string;
  isBot: boolean;
  action?: ActionBtn;
  secondaryAction?: ActionBtn;
}

type MenuCategory =
  | 'main'
  | 'library-shifts'
  | 'computer-courses'
  | 'admissions'
  | 'facilities'
  | 'timing-location'
  | 'helpline';

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export default function ChatBot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [currentMenu, setCurrentMenu] = useState<MenuCategory>('main');
  const [messages, setMessages] = useState<Message[]>([
    {
      text: '👋 **Welcome to Galaxy Library & Computer Center!**\n\nHow can I help you today? Please choose a topic below for instant details:',
      isBot: true,
    },
  ]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load live site content so courses, fees, and contact are always synchronized
  useEffect(() => {
    loadSiteContent()
      .then((res) => {
        if (res?.content) {
          setSiteContent(res.content);
        }
      })
      .catch((err) => {
        console.warn('ChatBot could not load remote content, using fallback:', err);
      });
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, currentMenu]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Safe phone and fees resolution
  const phone = siteContent.libraryInfo?.phone || '+91 7488252019';
  const phoneRaw = siteContent.libraryInfo?.phoneRaw || '917488252019';
  const libAdmissionFee = siteContent.admissionFees?.library ?? 5;
  const compAdmissionFee = siteContent.admissionFees?.computerCenter ?? 50;
  const courses: ComputerCourse[] =
    siteContent.computerCourses && siteContent.computerCourses.length > 0
      ? siteContent.computerCourses
      : DEFAULT_SITE_CONTENT.computerCourses || [];

  // ==================== GUIDED MENU ITEMS DEFINITION ====================
  const getMenuItems = (): MenuItem[] => {
    switch (currentMenu) {
      case 'main':
        return [
          {
            id: 'menu-library-shifts',
            title: 'Library Fees & Shift Plans',
            subtitle: '4hr, 6hr, 8hr, 12hr, 24hr & Night plans',
            icon: IndianRupee,
            badge: 'Popular',
          },
          {
            id: 'menu-computer-courses',
            title: 'Computer Center Courses',
            subtitle: 'ADCA, DCA, Tally with GST, BCC & more',
            icon: Monitor,
            badge: `${courses.length} Courses`,
          },
          {
            id: 'menu-admissions',
            title: 'Admission & Registration Process',
            subtitle: 'Online apply steps, documents & token fee',
            icon: FileText,
          },
          {
            id: 'menu-facilities',
            title: 'Facilities & Study Amenities',
            subtitle: 'AC, 5G Wi-Fi, RO Water, Solar Backup',
            icon: Wifi,
          },
          {
            id: 'menu-timing-location',
            title: 'Timings & Location Address',
            subtitle: 'Open 24 Hours • Dhirabigha, Tehta',
            icon: MapPin,
          },
          {
            id: 'menu-helpline',
            title: 'Helpline & Direct Contact',
            subtitle: 'Call manager or chat on WhatsApp',
            icon: Phone,
          },
        ];

      case 'library-shifts':
        return [
          {
            id: 'shift-4hr',
            title: '4 Hours Shift Plan',
            subtitle: '₹300 / month • Flexible timing',
            icon: Clock,
          },
          {
            id: 'shift-6hr',
            title: '6 Hours Shift Plan',
            subtitle: '₹400 / month • Reserved study desk',
            icon: Clock,
            badge: 'Recommended',
          },
          {
            id: 'shift-8hr',
            title: '8 Hours Shift Plan',
            subtitle: '₹500 / month • Ideal for serious aspirants',
            icon: Clock,
          },
          {
            id: 'shift-12hr',
            title: '12 Hours Shift Plan',
            subtitle: '₹600 / month • Maximum daily study slot',
            icon: Clock,
            badge: 'Best Value',
          },
          {
            id: 'shift-24hr',
            title: '24 Hours / Full Day Plan',
            subtitle: '₹800 / month • 24x7 Unlimited access',
            icon: Sun,
            badge: 'VIP Access',
          },
          {
            id: 'shift-night',
            title: 'Night Shift Plan',
            subtitle: '₹350 / month • Peaceful late night study',
            icon: Clock,
          },
          {
            id: 'shift-compare-all',
            title: 'Compare All Shift Plans',
            subtitle: 'Full fee comparison & amenities overview',
            icon: IndianRupee,
          },
          {
            id: 'nav-back-main',
            title: 'Back to Main Menu',
            subtitle: 'Return to main categories list',
            icon: ArrowLeft,
          },
        ];

      case 'computer-courses': {
        const list: MenuItem[] = courses.map((course) => ({
          id: `course-${course.id}`,
          title: `${course.title} - ${course.fullName || course.title}`,
          subtitle: `Duration: ${course.duration} • Fee: ₹${course.fee}`,
          icon: Monitor,
        }));
        list.push({
          id: 'course-all-summary',
          title: 'View All Courses Overview',
          subtitle: 'Compare all course durations and fees',
          icon: FileText,
        });
        list.push({
          id: 'nav-back-main',
          title: 'Back to Main Menu',
          subtitle: 'Return to main categories list',
          icon: ArrowLeft,
        });
        return list;
      }

      case 'admissions':
        return [
          {
            id: 'adm-library',
            title: 'How to take Library Admission?',
            subtitle: `Online registration process (Token: ₹${libAdmissionFee})`,
            icon: FileText,
          },
          {
            id: 'adm-computer',
            title: 'How to enroll in Computer Center?',
            subtitle: `Batch allocation & registration (Token: ₹${compAdmissionFee})`,
            icon: Monitor,
          },
          {
            id: 'adm-docs',
            title: 'Required Documents for Admission',
            subtitle: 'Aadhaar, photo and contact verification',
            icon: CheckCircle2,
          },
          {
            id: 'adm-fees',
            title: 'Registration Fees & Payment Modes',
            subtitle: 'UPI, QR Code, Online & Cash details',
            icon: IndianRupee,
          },
          {
            id: 'nav-back-main',
            title: 'Back to Main Menu',
            subtitle: 'Return to main categories list',
            icon: ArrowLeft,
          },
        ];

      case 'facilities':
        return [
          {
            id: 'fac-ac',
            title: 'AC & Solar Power Backup',
            subtitle: '100% cooling & non-stop electricity guarantee',
            icon: Sun,
          },
          {
            id: 'fac-wifi',
            title: '5G Wi-Fi & Personal Charging Ports',
            subtitle: 'High-speed internet + charging on every desk',
            icon: Wifi,
          },
          {
            id: 'fac-water',
            title: 'RO Drinking Water & Clean Washrooms',
            subtitle: 'Pure chilled/normal water & high hygiene',
            icon: ShieldCheck,
          },
          {
            id: 'fac-ambience',
            title: 'Newspapers, Magazines & Silence',
            subtitle: 'Daily dailies & pin-drop silent environment',
            icon: FileText,
          },
          {
            id: 'fac-safety',
            title: 'CCTV Surveillance & Girls Safety',
            subtitle: '24x7 HD cameras & disciplined atmosphere',
            icon: ShieldCheck,
          },
          {
            id: 'nav-back-main',
            title: 'Back to Main Menu',
            subtitle: 'Return to main categories list',
            icon: ArrowLeft,
          },
        ];

      case 'timing-location':
        return [
          {
            id: 'time-hours',
            title: 'Library Operating Hours',
            subtitle: 'Open 24x7, 365 Days including holidays',
            icon: Clock,
          },
          {
            id: 'time-address',
            title: 'Complete Postal Address & Landmark',
            subtitle: 'Dhirabigha Sugaon Road, Tehta, Jehanabad',
            icon: MapPin,
          },
          {
            id: 'time-map',
            title: 'Open in Google Maps Navigation',
            subtitle: 'Get directions directly to the campus',
            icon: ExternalLink,
          },
          {
            id: 'nav-back-main',
            title: 'Back to Main Menu',
            subtitle: 'Return to main categories list',
            icon: ArrowLeft,
          },
        ];

      case 'helpline':
        return [
          {
            id: 'help-call',
            title: `Call Helpline: ${phone}`,
            subtitle: 'Direct telephone line to manager/front desk',
            icon: Phone,
          },
          {
            id: 'help-whatsapp',
            title: 'Chat with us on WhatsApp',
            subtitle: 'Instant messaging support & seat booking',
            icon: MessageCircle,
          },
          {
            id: 'help-email',
            title: 'Support Email Address',
            subtitle: 'galaxy.library@gmail.com',
            icon: FileText,
          },
          {
            id: 'nav-back-main',
            title: 'Back to Main Menu',
            subtitle: 'Return to main categories list',
            icon: ArrowLeft,
          },
        ];

      default:
        return [];
    }
  };

  // ==================== HANDLE MENU ITEM CLICK ====================
  const handleMenuSelect = (itemId: string) => {
    // 1. Navigation back
    if (itemId === 'nav-back-main') {
      setMessages((prev) => [
        ...prev,
        { text: '⬅️ Back to Main Menu', isBot: false },
        {
          text: 'Here are the main topics. Please select an option to continue:',
          isBot: true,
        },
      ]);
      setCurrentMenu('main');
      return;
    }

    // 2. Main menu category selection -> Open Sub-menu
    if (itemId === 'menu-library-shifts') {
      setMessages((prev) => [
        ...prev,
        { text: 'Library Fees & Shift Plans', isBot: false },
        {
          text: 'Here are our study shift options. Please select a shift to view timings, seat details & monthly fee:',
          isBot: true,
        },
      ]);
      setCurrentMenu('library-shifts');
      return;
    }

    if (itemId === 'menu-computer-courses') {
      setMessages((prev) => [
        ...prev,
        { text: 'Computer Center Courses', isBot: false },
        {
          text: `We offer ${courses.length} certified computer & technical courses. Select any course to view duration, syllabus highlights & fee:`,
          isBot: true,
        },
      ]);
      setCurrentMenu('computer-courses');
      return;
    }

    if (itemId === 'menu-admissions') {
      setMessages((prev) => [
        ...prev,
        { text: 'Admission & Registration Process', isBot: false },
        {
          text: 'What would you like to know about our admission and enrollment process? Select an option below:',
          isBot: true,
        },
      ]);
      setCurrentMenu('admissions');
      return;
    }

    if (itemId === 'menu-facilities') {
      setMessages((prev) => [
        ...prev,
        { text: 'Facilities & Study Amenities', isBot: false },
        {
          text: 'Galaxy Library is equipped with modern infrastructure. Select any facility to learn more:',
          isBot: true,
        },
      ]);
      setCurrentMenu('facilities');
      return;
    }

    if (itemId === 'menu-timing-location') {
      setMessages((prev) => [
        ...prev,
        { text: 'Timings & Location Address', isBot: false },
        {
          text: 'Please select what details you need regarding our campus location and hours:',
          isBot: true,
        },
      ]);
      setCurrentMenu('timing-location');
      return;
    }

    if (itemId === 'menu-helpline') {
      setMessages((prev) => [
        ...prev,
        { text: 'Helpline & Direct Contact', isBot: false },
        {
          text: 'Choose your preferred method to connect with the Galaxy Library administration team:',
          isBot: true,
        },
      ]);
      setCurrentMenu('helpline');
      return;
    }

    // 3. Shift Details Answers
    if (itemId.startsWith('shift-')) {
      const shiftMap: Record<
        string,
        { name: string; fee: string; time: string; actionShift: string }
      > = {
        'shift-4hr': {
          name: '4 Hours Shift Plan',
          fee: '₹300 / month',
          time: 'Any flexible 4 continuous hours',
          actionShift: '4hr',
        },
        'shift-6hr': {
          name: '6 Hours Shift Plan',
          fee: '₹400 / month',
          time: 'Any continuous 6 hours slot (Morning, Noon or Evening)',
          actionShift: '6hr',
        },
        'shift-8hr': {
          name: '8 Hours Shift Plan',
          fee: '₹500 / month',
          time: 'Full-day 8 continuous hours dedicated focus slot',
          actionShift: '8hr',
        },
        'shift-12hr': {
          name: '12 Hours Shift Plan',
          fee: '₹600 / month',
          time: '12 Hours extended study slot (e.g. 6:00 AM - 6:00 PM)',
          actionShift: '12hr',
        },
        'shift-24hr': {
          name: '24 Hours / Full Day Plan',
          fee: '₹800 / month',
          time: 'Round-the-clock 24x7 unlimited access anytime',
          actionShift: '24hr',
        },
        'shift-night': {
          name: 'Night Shift Plan',
          fee: '₹350 / month',
          time: 'Quiet overnight preparation shift (e.g. 9:00 PM - 6:00 AM)',
          actionShift: 'night',
        },
      };

      if (itemId === 'shift-compare-all') {
        setMessages((prev) => [
          ...prev,
          { text: 'Compare All Shift Plans', isBot: false },
          {
            text: `📊 **Galaxy Library Shift Plans & Monthly Pricing:**\n\n• **4 Hours:** ₹300 / month\n• **6 Hours:** ₹400 / month (Most Popular)\n• **8 Hours:** ₹500 / month\n• **12 Hours:** ₹600 / month (Best Value)\n• **Night Shift:** ₹350 / month\n• **24 Hours (Full Day):** ₹800 / month (VIP 24x7 Access)\n\n✨ **All plans include:**\n- Free High-Speed 5G Wi-Fi\n- Air-Conditioned (AC) study space\n- Dedicated desk power socket for laptop/phone\n- Chilled & normal RO drinking water\n- Daily newspapers & quiet study ambience\n- Solar & Inverter power backup\n\n📝 **Online Registration Fee:** ₹${libAdmissionFee} only (One-time)`,
            isBot: true,
            action: { label: '📝 Apply for Admission', path: '/apply' },
            secondaryAction: {
              label: '💬 Chat on WhatsApp',
              url: `https://wa.me/91${phoneRaw}?text=Hi! I want to enroll in Galaxy Library.`,
            },
          },
        ]);
        return;
      }

      const shiftInfo = shiftMap[itemId];
      if (shiftInfo) {
        setMessages((prev) => [
          ...prev,
          { text: shiftInfo.name, isBot: false },
          {
            text: `✨ **${shiftInfo.name} Details:**\n\n• **Monthly Fee:** ${shiftInfo.fee}\n• **Timings:** ${shiftInfo.time}\n• **Included Amenities:**\n  - Reserved personal study desk\n  - High-Speed Wi-Fi & Individual desk charging port\n  - 100% Air-Conditioned (AC) hall\n  - Uninterrupted Solar & Inverter power backup\n  - Chilled RO Drinking Water\n  - Daily Hindi & English Newspapers\n  - Disciplined, pin-drop silent environment\n\n• **Registration Fee:** ₹${libAdmissionFee} only (One-time online registration)`,
            isBot: true,
            action: {
              label: `📝 Apply for ${shiftInfo.name.split(' ')[0]} Shift`,
              path: `/apply?shift=${shiftInfo.actionShift}`,
            },
            secondaryAction: {
              label: '💬 Ask on WhatsApp',
              url: `https://wa.me/91${phoneRaw}?text=Hi! I am interested in ${shiftInfo.name} (${shiftInfo.fee}) at Galaxy Library.`,
            },
          },
        ]);
        return;
      }
    }

    // 4. Computer Course Details Answers
    if (itemId.startsWith('course-')) {
      if (itemId === 'course-all-summary') {
        const summaryText = courses
          .map((c, i) => `${i + 1}. **${c.title}** (${c.duration}) — ₹${c.fee}`)
          .join('\n');
        setMessages((prev) => [
          ...prev,
          { text: 'View All Courses Overview', isBot: false },
          {
            text: `💻 **Galaxy Computer Center — Course Catalog:**\n\n${summaryText}\n\n🎓 **Key Features:**\n- 1 Student = 1 Computer practical training\n- Government recognized certification upon completion\n- Experienced faculty guidance & job-oriented curriculum\n- Flexible Morning & Evening batch schedules\n\n📝 **One-time Registration Fee:** ₹${compAdmissionFee} only`,
            isBot: true,
            action: { label: '📝 Register for a Course', path: '/computercenter/registration' },
            secondaryAction: {
              label: '🌐 View All Courses Page',
              path: '/computercenter/courses',
            },
          },
        ]);
        return;
      }

      const courseId = itemId.replace('course-', '');
      const selectedCourse = courses.find((c) => c.id === courseId);
      if (selectedCourse) {
        setMessages((prev) => [
          ...prev,
          { text: `${selectedCourse.title} Details`, isBot: false },
          {
            text: `🎓 **${selectedCourse.title} (${selectedCourse.fullName || selectedCourse.title})**\n\n• **Course Duration:** ${selectedCourse.duration}\n• **Total Course Fee:** ₹${selectedCourse.fee}\n• **Curriculum & Practical Highlights:**\n  - Comprehensive theoretical concepts with 100% hands-on practical lab sessions\n  - Step-by-step guidance under experienced mentors\n  - Real-world assignments and project work\n  - Certification provided on completion\n\n• **Batch Timings:** Flexible Morning & Evening slots\n• **One-time Registration Fee:** ₹${compAdmissionFee}`,
            isBot: true,
            action: {
              label: `📝 Register for ${selectedCourse.title}`,
              path: `/computercenter/registration?course=${selectedCourse.id}`,
            },
            secondaryAction: {
              label: '💬 Inquire on WhatsApp',
              url: `https://wa.me/91${phoneRaw}?text=Hi! I would like details about ${selectedCourse.title} course at Galaxy Computer Center.`,
            },
          },
        ]);
        return;
      }
    }

    // 5. Admission Answers
    if (itemId === 'adm-library') {
      setMessages((prev) => [
        ...prev,
        { text: 'How to take Library Admission?', isBot: false },
        {
          text: `📚 **Steps for Library Admission:**\n\n1. **Online Form:** Click "Apply Online" or visit the \`/apply\` portal.\n2. **Fill Details:** Enter your Name, Mobile number, Address, and choose your preferred study shift (4hr, 6hr, 8hr, etc.).\n3. **Pay Registration:** Pay the nominal ₹${libAdmissionFee} registration fee via UPI / QR Code.\n4. **Download Slip:** Receive your digital admission confirmation slip immediately.\n5. **Desk Seat Allotment:** Show the slip at the library front desk, verify your Aadhaar card, and get your reserved seat allotted right away!`,
          isBot: true,
          action: { label: '📝 Apply for Library Online', path: '/apply' },
        },
      ]);
      return;
    }

    if (itemId === 'adm-computer') {
      setMessages((prev) => [
        ...prev,
        { text: 'How to enroll in Computer Center?', isBot: false },
        {
          text: `💻 **Steps for Computer Course Enrollment:**\n\n1. **Select Course:** Choose from ADCA, DCA, Tally with GST, BCC, etc.\n2. **Online Registration:** Go to \`/computercenter/registration\` and submit your form.\n3. **Pay Token Fee:** Pay the ₹${compAdmissionFee} registration token fee.\n4. **Batch Confirmation:** Our coordinator will assign your preferred Morning or Evening batch.\n5. **Start Learning:** Begin hands-on lab sessions at Dhirabigha, Tehta campus!`,
          isBot: true,
          action: { label: '📝 Register for Computer Classes', path: '/computercenter/registration' },
        },
      ]);
      return;
    }

    if (itemId === 'adm-docs') {
      setMessages((prev) => [
        ...prev,
        { text: 'Required Documents for Admission', isBot: false },
        {
          text: `📑 **Documents Required for Admission:**\n\n• 1 Recent Passport-sized Photograph\n• Photocopy or Digital Copy of Aadhaar Card (for identity verification)\n• Active Mobile Number (for SMS notifications & admission slip)\n• College / Exam Admit Card (Optional)\n\n*Note: Verification takes less than 2 minutes at the desk.*`,
          isBot: true,
        },
      ]);
      return;
    }

    if (itemId === 'adm-fees') {
      setMessages((prev) => [
        ...prev,
        { text: 'Registration Fees & Payment Modes', isBot: false },
        {
          text: `💳 **Registration Fees & Payment Modes:**\n\n• **Library Online Registration:** ₹${libAdmissionFee} only (One-time)\n• **Computer Center Registration:** ₹${compAdmissionFee} only (One-time)\n\n• **Payment Methods Supported:**\n  - UPI (Google Pay, PhonePe, Paytm, BHIM)\n  - Direct QR Code scan at reception\n  - Cash at front desk\n  - Instant digital receipt issued for every transaction`,
          isBot: true,
          action: { label: '📝 Start Online Application', path: '/apply' },
        },
      ]);
      return;
    }

    // 6. Facilities Answers
    if (itemId === 'fac-ac') {
      setMessages((prev) => [
        ...prev,
        { text: 'AC & Solar Power Backup', isBot: false },
        {
          text: `❄️ **Central Air Conditioning & Solar Power Backup:**\n\n• Fully Air-Conditioned study hall maintained at optimal comfort (24°C).\n• High-capacity Solar Plant + Commercial Inverter setup.\n• **Zero Power Blackout:** Even during long power cuts in summer, AC, lights, fans, and Wi-Fi run continuously without disruption!`,
          isBot: true,
        },
      ]);
      return;
    }

    if (itemId === 'fac-wifi') {
      setMessages((prev) => [
        ...prev,
        { text: '5G Wi-Fi & Personal Charging Ports', isBot: false },
        {
          text: `📶 **High-Speed Wi-Fi & Dedicated Charging Sockets:**\n\n• Unlimited ultra-fast fiber broadband with redundant backup lines.\n• Smooth streaming for online lectures, Zoom sessions, and mock exams.\n• **Individual Power Socket:** Every single desk features a dedicated multi-pin power outlet to charge your laptop, tablet, or phone safely.`,
          isBot: true,
        },
      ]);
      return;
    }

    if (itemId === 'fac-water') {
      setMessages((prev) => [
        ...prev,
        { text: 'RO Drinking Water & Clean Washrooms', isBot: false },
        {
          text: `💧 **RO Purified Water & Hygiene:**\n\n• Advanced multi-stage RO + UV water purification system.\n• Chilled drinking water available during summers, and normal water year-round.\n• Dedicated maintenance staff ensuring clean study desks, tidy floors, and hygienic sanitized washrooms.`,
          isBot: true,
        },
      ]);
      return;
    }

    if (itemId === 'fac-ambience') {
      setMessages((prev) => [
        ...prev,
        { text: 'Newspapers, Magazines & Silence', isBot: false },
        {
          text: `📰 **Study Materials & Disciplined Ambience:**\n\n• Daily leading Hindi & English newspapers (The Hindu, Dainik Jagran, Prabhat Khabar).\n• Monthly competitive magazines & current affairs digests.\n• Sound-insulated environment ensuring pin-drop silence and zero distractions for peak focus.`,
          isBot: true,
        },
      ]);
      return;
    }

    if (itemId === 'fac-safety') {
      setMessages((prev) => [
        ...prev,
        { text: 'CCTV Surveillance & Girls Safety', isBot: false },
        {
          text: `🛡️ **Safety, Security & Girls-Friendly Environment:**\n\n• 24x7 High-Definition CCTV camera monitoring across campus and entry.\n• Strict discipline maintained with zero tolerance for nuisance.\n• Safe & secure for female students during morning, evening, and regular study slots.\n• Secure on-site parking for bicycles and two-wheelers.`,
          isBot: true,
        },
      ]);
      return;
    }

    // 7. Timing & Location Answers
    if (itemId === 'time-hours') {
      setMessages((prev) => [
        ...prev,
        { text: 'Library Operating Hours', isBot: false },
        {
          text: `⏰ **Operating Hours:**\n\n• **Open 24 Hours a Day**, 7 days a week, 365 days a year.\n• Open on all Sundays and public/festival holidays.\n• Students can choose their study shifts according to their personal schedule and comfort.`,
          isBot: true,
        },
      ]);
      return;
    }

    if (itemId === 'time-address') {
      const address = siteContent.libraryInfo?.address || 'Dhirabigha Sugaon Road, Tehta, Bihar';
      setMessages((prev) => [
        ...prev,
        { text: 'Complete Postal Address & Landmark', isBot: false },
        {
          text: `📍 **Campus Address & Directions:**\n\n• **Address:** ${address}\n• **Town/District:** Tehta, Jehanabad, Bihar\n• **Nearby Landmarks:** Near Tehta High School & Tehta Railway Station.\n• **Accessibility:** Easily accessible via main road, with convenient parking space.`,
          isBot: true,
          action: {
            label: '🗺️ Open in Google Maps',
            url:
              siteContent.libraryInfo?.mapUrl ||
              'https://maps.google.com/?q=Galaxy+Library+Tehta+Jehanabad',
          },
        },
      ]);
      return;
    }

    if (itemId === 'time-map') {
      const mapUrl =
        siteContent.libraryInfo?.mapUrl ||
        'https://maps.google.com/?q=Galaxy+Library+Tehta+Jehanabad';
      window.open(mapUrl, '_blank');
      setMessages((prev) => [
        ...prev,
        { text: 'Opened Google Maps Directions', isBot: false },
        {
          text: 'Google Maps directions opened in a new tab. Let me know if you need any assistance reaching the library!',
          isBot: true,
        },
      ]);
      return;
    }

    // 8. Helpline Answers
    if (itemId === 'help-call') {
      window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
      setMessages((prev) => [
        ...prev,
        { text: `Calling ${phone}`, isBot: false },
        {
          text: `Calling ${phone}. You can reach out between 8:00 AM and 10:00 PM for inquiries, fee details, or seat bookings.`,
          isBot: true,
        },
      ]);
      return;
    }

    if (itemId === 'help-whatsapp') {
      window.open(
        `https://wa.me/91${phoneRaw}?text=Hi! I want to know more about Galaxy Library and Computer Center.`,
        '_blank'
      );
      setMessages((prev) => [
        ...prev,
        { text: 'Chat on WhatsApp', isBot: false },
        {
          text: 'Redirecting to WhatsApp chat with the Galaxy Library official support team...',
          isBot: true,
        },
      ]);
      return;
    }

    if (itemId === 'help-email') {
      const email = siteContent.libraryInfo?.email || 'galaxy.library@gmail.com';
      window.location.href = `mailto:${email}`;
      setMessages((prev) => [
        ...prev,
        { text: `Email: ${email}`, isBot: false },
        {
          text: `You can send your queries or document submissions to **${email}**. We respond within 24 hours.`,
          isBot: true,
        },
      ]);
      return;
    }
  };

  // Helper to render bold markdown formatting smoothly without extra dependencies
  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      if (!line) {
        return <div key={lineIdx} className="h-2" />;
      }
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={lineIdx} className="min-h-[1.25rem]">
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong
                  key={partIdx}
                  className="font-bold text-slate-900 dark:text-white"
                >
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={partIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  const handleActionClick = (action: ActionBtn) => {
    if (action.path) {
      navigate(action.path);
    } else if (action.url) {
      window.open(action.url, '_blank');
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Floating Action Buttons (WhatsApp & ChatBot) */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-3.5">
          <a
            href={`https://wa.me/91${phoneRaw}?text=Hi! I want to know more about Galaxy Library.`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 sm:p-4 bg-gradient-to-tr from-green-500 to-emerald-600 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgba(34,197,94,0.5)] transition-all transform hover:scale-110 flex items-center justify-center animate-bounce group"
            style={{ animationDuration: '3.5s' }}
            title="Chat on WhatsApp"
          >
            <MessageCircle size={26} className="group-hover:rotate-12 transition-transform duration-300" />
          </a>

          <button
            onClick={() => setIsOpen(true)}
            className="p-3 sm:p-4 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.5)] transition-all transform hover:scale-110 flex items-center justify-center animate-bounce group"
            style={{ animationDuration: '3s' }}
            title="Ask Galaxy Assistant"
          >
            <Bot size={26} className="group-hover:rotate-12 transition-transform duration-300" />
            <Sparkles size={14} className="absolute top-2 right-2 text-yellow-300 animate-pulse" />
          </button>

          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="w-11 h-11 sm:w-12 sm:h-12 mx-auto bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-xl text-slate-700 dark:text-white rounded-full shadow-lg border border-slate-200/60 dark:border-slate-700/60 hover:bg-gradient-to-tr hover:from-blue-600 hover:to-indigo-600 hover:text-white transition-all transform hover:-translate-y-1 flex items-center justify-center group"
              title="Scroll to Top"
            >
              <ArrowUp size={20} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
            </button>
          )}
        </div>
      )}

      {/* Modern Guided Interactive Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-[calc(100vw-32px)] sm:w-[410px] h-[85vh] sm:h-[580px] max-h-[750px] sm:bottom-6 sm:right-6 bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden border border-slate-200/90 dark:border-slate-800 animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1e293b] via-blue-900 to-indigo-900 p-4 flex justify-between items-center text-white relative">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-200 border border-white/15 shadow-xs">
                  <Bot size={22} />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#1e293b] rounded-full animate-pulse"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight">Galaxy Assistant</h3>
                  <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-200 rounded border border-blue-400/30">
                    Interactive Guide
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Instant Answers & Shift Information
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCurrentMenu('main');
                  setMessages([
                    {
                      text: '👋 **Welcome to Galaxy Library & Computer Center!**\n\nHow can I help you today? Please choose a topic below for instant details:',
                      isBot: true,
                    },
                  ]);
                }}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Reset Chat"
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close Chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages & Interactive Options Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70 dark:bg-[#0b1120] text-slate-800 dark:text-slate-200">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 max-w-[92%] ${
                  msg.isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-xs ${
                    msg.isBot
                      ? 'bg-blue-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {msg.isBot ? <Bot size={16} /> : <User size={16} />}
                </div>

                <div className="space-y-2">
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.isBot
                        ? 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 rounded-tl-sm shadow-xs'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm shadow-sm'
                    }`}
                  >
                    {formatMessageText(msg.text)}

                    {/* Integrated Action Buttons */}
                    {(msg.action || msg.secondaryAction) && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-2">
                        {msg.action && (
                          <button
                            type="button"
                            onClick={() => handleActionClick(msg.action!)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            <span>{msg.action.label}</span>
                            <ChevronRight size={13} />
                          </button>
                        )}
                        {msg.secondaryAction && (
                          <button
                            type="button"
                            onClick={() => handleActionClick(msg.secondaryAction!)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                          >
                            <span>{msg.secondaryAction.label}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* ==================== INTERACTIVE GUIDED OPTIONS LIST (Matches Reference Image) ==================== */}
            {menuItems.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={12} className="text-blue-500" />
                    {currentMenu === 'main' ? 'Recommended Topics' : 'Select an Option'}
                  </span>
                  {currentMenu !== 'main' && (
                    <button
                      type="button"
                      onClick={() => setCurrentMenu('main')}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <ArrowLeft size={11} />
                      <span>Back</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleMenuSelect(item.id)}
                        className="w-full bg-white dark:bg-slate-800/90 hover:bg-blue-50/80 dark:hover:bg-slate-700/70 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between text-left transition-all active:scale-[0.98] shadow-xs group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                              {item.title}
                            </div>
                            {item.subtitle && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          {item.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight
                            size={14}
                            className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Clean Bottom Navigation Bar (No manual typing bar) */}
          <div className="p-3 bg-white dark:bg-[#0f172a] border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            {currentMenu !== 'main' && (
              <button
                type="button"
                onClick={() => {
                  setCurrentMenu('main');
                  scrollToBottom();
                }}
                className="py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 flex-shrink-0"
                title="Go back"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setCurrentMenu('main');
                scrollToBottom();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-blue-500/20 active:scale-98"
            >
              <Menu size={16} />
              <span>Browse All Topics (Menu)</span>
            </button>

            <a
              href={`https://wa.me/91${phoneRaw}?text=Hi! I want to know more about Galaxy Library.`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 flex-shrink-0"
              title="Chat on WhatsApp"
            >
              <MessageCircle size={15} />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}
