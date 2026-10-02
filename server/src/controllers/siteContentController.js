import SiteContent from '../models/SiteContent.js';
import { defaultSiteContent } from '../data/defaultSiteContent.js';

const toResponse = (doc) => ({
  announcement: doc.announcement
    ? {
        title: doc.announcement.title || '',
        text: doc.announcement.text || '',
        link: doc.announcement.link || '',
        endDate: doc.announcement.endDate || '',
        show: doc.announcement.show || false,
        upcomingText: doc.announcement.upcomingText || '',
      }
    : { title: '', text: '', link: '', endDate: '', show: false, upcomingText: '' },
  libraryInfo: doc.libraryInfo,
  admissionContact: doc.admissionContact,
  admissionFees: doc.admissionFees || defaultSiteContent.admissionFees || { library: 5, computerCenter: 50 },
  pageText: doc.pageText,
  navMenuItems: doc.navMenuItems,
  heroSlides: doc.heroSlides,
  aboutContent: doc.aboutContent,
  galleryImages: doc.galleryImages,
  facultyMembers: doc.facultyMembers,
  computerCenterTeachers:
    doc.computerCenterTeachers && doc.computerCenterTeachers.length > 0
      ? doc.computerCenterTeachers
      : defaultSiteContent.computerCenterTeachers || [],
  computerCourses:
    doc.computerCourses && doc.computerCourses.length > 0
      ? doc.computerCourses
      : defaultSiteContent.computerCourses || [],
  updatedAt: doc.updatedAt,
});

export const getSiteContent = async (req, res) => {
  try {
    let doc = await SiteContent.findOne({ key: 'landing' });

    if (!doc) {
      doc = await SiteContent.create(defaultSiteContent);
    }

    res.set('Cache-Control', 'no-store');
    res.status(200).json(toResponse(doc));
  } catch (error) {
    console.error('Error fetching site content:', error);
    res.status(500).json({ message: 'Error fetching site content', error: error.message });
  }
};

const mergeSiteContent = (existing, incoming) => {
  const base = existing ?? defaultSiteContent;

  return {
    announcement: {
      ...defaultSiteContent.announcement,
      ...base.announcement,
      ...(incoming.announcement ?? {}),
    },
    libraryInfo: {
      ...defaultSiteContent.libraryInfo,
      ...base.libraryInfo,
      ...(incoming.libraryInfo ?? {}),
    },
    admissionContact: {
      ...defaultSiteContent.admissionContact,
      ...base.admissionContact,
      ...(incoming.admissionContact ?? {}),
    },
    admissionFees: {
      library:
        typeof incoming.admissionFees?.library === 'number'
          ? incoming.admissionFees.library
          : (base.admissionFees?.library ?? defaultSiteContent.admissionFees?.library ?? 5),
      computerCenter:
        typeof incoming.admissionFees?.computerCenter === 'number'
          ? incoming.admissionFees.computerCenter
          : (base.admissionFees?.computerCenter ?? defaultSiteContent.admissionFees?.computerCenter ?? 50),
    },
    pageText: {
      ...defaultSiteContent.pageText,
      ...base.pageText,
      ...(incoming.pageText ?? {}),
    },
    navMenuItems:
      Array.isArray(incoming.navMenuItems) && incoming.navMenuItems.length > 0
        ? incoming.navMenuItems
        : base.navMenuItems?.length > 0
          ? base.navMenuItems
          : defaultSiteContent.navMenuItems,
    heroSlides:
      Array.isArray(incoming.heroSlides) && incoming.heroSlides.length > 0
        ? incoming.heroSlides
        : base.heroSlides?.length > 0
          ? base.heroSlides
          : defaultSiteContent.heroSlides,
    aboutContent: {
      ...defaultSiteContent.aboutContent,
      ...base.aboutContent,
      ...(incoming.aboutContent ?? {}),
      paragraphs:
        Array.isArray(incoming.aboutContent?.paragraphs) && incoming.aboutContent.paragraphs.length > 0
          ? incoming.aboutContent.paragraphs
          : base.aboutContent?.paragraphs?.length > 0
            ? base.aboutContent.paragraphs
            : defaultSiteContent.aboutContent.paragraphs,
      highlights:
        Array.isArray(incoming.aboutContent?.highlights) && incoming.aboutContent.highlights.length > 0
          ? incoming.aboutContent.highlights
          : base.aboutContent?.highlights?.length > 0
            ? base.aboutContent.highlights
            : defaultSiteContent.aboutContent.highlights,
    },
    galleryImages:
      Array.isArray(incoming.galleryImages) && incoming.galleryImages.length > 0
        ? incoming.galleryImages
        : base.galleryImages?.length > 0
          ? base.galleryImages
          : defaultSiteContent.galleryImages,
    facultyMembers:
      Array.isArray(incoming.facultyMembers) && incoming.facultyMembers.length > 0
        ? incoming.facultyMembers
        : base.facultyMembers?.length > 0
          ? base.facultyMembers
          : defaultSiteContent.facultyMembers,
    computerCenterTeachers:
      Array.isArray(incoming.computerCenterTeachers) && incoming.computerCenterTeachers.length > 0
        ? incoming.computerCenterTeachers
        : base.computerCenterTeachers?.length > 0
          ? base.computerCenterTeachers
          : defaultSiteContent.computerCenterTeachers || [],
    computerCourses:
      Array.isArray(incoming.computerCourses) && incoming.computerCourses.length > 0
        ? incoming.computerCourses
        : base.computerCourses?.length > 0
          ? base.computerCourses
          : defaultSiteContent.computerCourses || [],
  };
};

export const updateSiteContent = async (req, res) => {
  try {
    const existingDoc = await SiteContent.findOne({ key: 'landing' });
    const existing = existingDoc ? toResponse(existingDoc) : null;
    const merged = mergeSiteContent(existing, req.body);

    const doc = await SiteContent.findOneAndUpdate(
      { key: 'landing' },
      { $set: { ...merged, updatedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.set('Cache-Control', 'no-store');
    res.status(200).json({
      message: 'Website content updated successfully',
      ...toResponse(doc),
    });
  } catch (error) {
    console.error('Error updating site content:', error);
    res.status(500).json({ message: 'Error updating site content', error: error.message });
  }
};
