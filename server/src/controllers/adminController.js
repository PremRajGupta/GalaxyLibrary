import Admin from '../models/Admin.js';
import SiteContent from '../models/SiteContent.js';

export const getAdminProfile = async (req, res) => {
  try {
    const adminEmail = (req.user?.email || process.env.ADMIN_EMAIL || 'admin@library.com').toLowerCase().trim();

    let admin = await Admin.findOne({ 
      $or: [
        { email: adminEmail },
        { role: 'admin' }
      ]
    }).lean();

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
    const adminEmail = (req.user?.email || process.env.ADMIN_EMAIL || 'admin@library.com').toLowerCase().trim();
    const { displayName, phone, photoURL, libraryName, address, bio } = req.body;

    let admin = await Admin.findOne({
      $or: [
        { email: adminEmail },
        { role: 'admin' }
      ]
    });

    if (!admin) {
      admin = new Admin({
        email: adminEmail,
        role: 'admin'
      });
    }

    if (displayName !== undefined) admin.displayName = displayName;
    if (phone !== undefined) admin.phone = phone;
    if (photoURL !== undefined) admin.photoURL = photoURL;
    if (libraryName !== undefined) admin.libraryName = libraryName;
    if (address !== undefined) admin.address = address;
    if (bio !== undefined) admin.bio = bio;

    await admin.save();

    // Optionally sync with SiteContent libraryInfo
    try {
      const site = await SiteContent.findOne({ key: 'landing' });
      if (site) {
        let changed = false;
        if (displayName && site.libraryInfo.ownerName !== displayName) {
          site.libraryInfo.ownerName = displayName;
          changed = true;
        }
        if (phone && site.libraryInfo.phone !== phone) {
          site.libraryInfo.phone = phone;
          site.libraryInfo.phoneRaw = phone.replace(/[^0-9]/g, '');
          changed = true;
        }
        if (address && site.libraryInfo.address !== address) {
          site.libraryInfo.address = address;
          changed = true;
        }
        if (libraryName && site.libraryInfo.name !== libraryName) {
          site.libraryInfo.name = libraryName;
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
