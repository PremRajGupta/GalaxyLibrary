import Admin from '../models/Admin.js';
import SiteContent from '../models/SiteContent.js';

export const getAdminProfile = async (req, res) => {
  try {
    const adminEmail = (req.query?.email || req.user?.email || process.env.ADMIN_EMAIL || 'admin@library.com').toLowerCase().trim();

    // Find the primary admin document
    let admin = await Admin.findOne({ role: 'admin' }).lean();
    if (!admin) {
      admin = await Admin.findOne({ email: adminEmail }).lean();
    }
    if (!admin) {
      admin = await Admin.findOne().lean();
    }

    if (!admin) {
      // Create initial profile if not exists
      const newAdmin = new Admin({
        email: adminEmail,
        displayName: 'Library Admin',
        phone: '+91 7488252019',
        libraryName: 'Galaxy Library',
        address: 'DhiraBigha Sugaon Road, Tehtar, Bihar',
        role: 'admin',
        bio: 'Head Administrator of Galaxy Library & Computer Center'
      });
      await newAdmin.save();
      admin = newAdmin.toObject();
    }

    return res.json({
      success: true,
      profile: admin
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin profile',
      error: error.message
    });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const adminEmail = (req.body?.email || req.user?.email || process.env.ADMIN_EMAIL || 'admin@library.com').toLowerCase().trim();
    const { displayName, phone, photoURL, libraryName, address, bio, email } = req.body;

    // Find primary admin profile
    let admin = await Admin.findOne({ role: 'admin' });
    if (!admin) {
      admin = await Admin.findOne({ email: adminEmail });
    }
    if (!admin) {
      admin = await Admin.findOne();
    }

    if (!admin) {
      admin = new Admin({
        email: email ? email.toLowerCase().trim() : adminEmail,
        role: 'admin'
      });
    }

    if (displayName !== undefined && displayName !== null) admin.displayName = displayName.trim();
    if (phone !== undefined && phone !== null) admin.phone = phone.trim();
    if (photoURL !== undefined) admin.photoURL = photoURL;
    if (libraryName !== undefined && libraryName !== null) admin.libraryName = libraryName.trim();
    if (address !== undefined && address !== null) admin.address = address.trim();
    if (bio !== undefined && bio !== null) admin.bio = bio.trim();
    if (email && email.trim()) admin.email = email.toLowerCase().trim();

    await admin.save();

    // Sync with SiteContent landing config
    try {
      let site = await SiteContent.findOne({ key: 'landing' });
      if (site) {
        if (!site.libraryInfo) site.libraryInfo = {};
        let changed = false;

        if (displayName && site.libraryInfo.ownerName !== displayName.trim()) {
          site.libraryInfo.ownerName = displayName.trim();
          changed = true;
        }
        if (phone && site.libraryInfo.phone !== phone.trim()) {
          site.libraryInfo.phone = phone.trim();
          site.libraryInfo.phoneRaw = phone.trim().replace(/[^0-9]/g, '');
          changed = true;
        }
        if (address && site.libraryInfo.address !== address.trim()) {
          site.libraryInfo.address = address.trim();
          changed = true;
        }
        if (libraryName && site.libraryInfo.name !== libraryName.trim()) {
          site.libraryInfo.name = libraryName.trim();
          changed = true;
        }
        if (email && site.libraryInfo.email !== email.trim()) {
          site.libraryInfo.email = email.trim();
          changed = true;
        }
        if (changed) {
          await site.save();
        }
      }
    } catch (siteErr) {
      console.warn('Could not sync with SiteContent:', siteErr.message);
    }

    return res.json({
      success: true,
      message: 'Admin profile updated successfully',
      profile: admin
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update admin profile',
      error: error.message
    });
  }
};
