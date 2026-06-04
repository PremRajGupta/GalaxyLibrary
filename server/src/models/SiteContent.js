import mongoose from 'mongoose';

const highlightSchema = new mongoose.Schema(
  {
    label: { type: String, default: '' },
    value: { type: String, default: '' },
  },
  { _id: false }
);

const heroSlideSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    image: { type: String, default: '' },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
  },
  { _id: false }
);

const galleryImageSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    src: { type: String, default: '' },
    title: { type: String, default: '' },
    alt: { type: String, default: '' },
  },
  { _id: false }
);

const facultyMemberSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    photo: { type: String, default: '' },
    name: { type: String, default: '' },
    role: { type: String, default: '' },
    detail: { type: String, default: '' },
  },
  { _id: false }
);

const navMenuItemSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    label: { type: String, default: '' },
    sectionId: { type: String, default: 'home' },
  },
  { _id: false }
);

const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'landing', unique: true },
    libraryInfo: {
      name: { type: String, default: '' },
      tagline: { type: String, default: '' },
      ownerName: { type: String, default: '' },
      phone: { type: String, default: '' },
      phoneRaw: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
      whatsappMessage: { type: String, default: '' },
    },
    heroSlides: { type: [heroSlideSchema], default: [] },
    aboutContent: {
      title: { type: String, default: '' },
      paragraphs: { type: [String], default: [] },
      highlights: { type: [highlightSchema], default: [] },
    },
    galleryImages: { type: [galleryImageSchema], default: [] },
    facultyMembers: { type: [facultyMemberSchema], default: [] },
    navMenuItems: { type: [navMenuItemSchema], default: [] },
    pageText: {
      navHome: { type: String, default: 'Home' },
      navAbout: { type: String, default: 'About' },
      navStats: { type: String, default: 'Stats' },
      navContact: { type: String, default: 'Contact Us' },
      navLogin: { type: String, default: 'Login' },
      heroVisitButton: { type: String, default: 'Visit' },
      heroContactButton: { type: String, default: 'Contact' },
      galleryTitle: { type: String, default: 'Our Library Gallery' },
      gallerySubtitle: { type: String, default: '' },
      facultyTitle: { type: String, default: 'Faculty Library' },
      facultySubtitle: { type: String, default: '' },
      contactTitle: { type: String, default: 'Contact Us' },
      contactSubtitle: { type: String, default: '' },
      contactPhoneLabel: { type: String, default: 'Phone' },
      contactEmailLabel: { type: String, default: 'Email' },
      contactAddressLabel: { type: String, default: 'Address' },
      whatsappButton: { type: String, default: 'Chat on WhatsApp' },
      footerQuickLinksTitle: { type: String, default: 'Quick Links' },
      footerGetStartedTitle: { type: String, default: 'Get Started' },
      footerGetStartedText: { type: String, default: '' },
      footerLoginButton: { type: String, default: 'Login' },
      footerCopyright: { type: String, default: 'All rights reserved.' },
      statsTitle: { type: String, default: 'Our Growth in Numbers' },
      statsSubtitle: { type: String, default: '' },
      statsAdmissionsLabel: { type: String, default: 'Total Admissions' },
      statsVisitorsLabel: { type: String, default: 'Website Visitors' },
      statsAvailableSeatsLabel: { type: String, default: 'Seats Available' },
      statsOccupiedSeatsLabel: { type: String, default: 'Seats Occupied' },
      statsStudyShiftsLabel: { type: String, default: 'Flexible Study Shifts' },
      statsOccupancyLabel: { type: String, default: 'Seat Occupancy' },
      statsFootnote: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export default mongoose.model('SiteContent', siteContentSchema);
