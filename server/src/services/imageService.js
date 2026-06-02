import { v2 as cloudinary } from 'cloudinary';

class ImageService {
  constructor() {
    this.configured = false;
  }

  ensureConfig() {
    if (!this.configured) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      this.configured = true;
    }
  }

  /**
   * Upload image to Cloudinary (from file buffer)
   */
  async uploadImage(file, folder, type = 'general') {
    this.ensureConfig();
    try {
      const uploadPath = `${folder}/${type}`;
      
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: uploadPath,
            resource_type: 'auto'
          },
          (error, result) => {
            if (error) {
              console.error('Image upload error:', error);
              return reject(new Error(`Failed to upload image: ${error.message}`));
            }
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              size: result.bytes,
              width: result.width,
              height: result.height,
              format: result.format
            });
          }
        );

        uploadStream.end(file.buffer);
      });
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Upload base64 image to Cloudinary
   */
  async uploadBase64(base64String, folder, type = 'general') {
    this.ensureConfig();
    try {
      const uploadPath = `${folder}/${type}`;
      
      const response = await cloudinary.uploader.upload(base64String, {
        folder: uploadPath,
        resource_type: 'auto'
      });

      return {
        url: response.secure_url,
        publicId: response.public_id,
        size: response.bytes,
        width: response.width,
        height: response.height,
        format: response.format
      };
    } catch (error) {
      console.error('Base64 image upload error:', error);
      throw new Error(`Failed to upload base64 image: ${error.message}`);
    }
  }

  /**
   * Get optimized image URL for different devices
   */
  getOptimizedUrl(publicId, device = 'desktop') {
    this.ensureConfig();
    const widths = {
      mobile: 500,
      tablet: 800,
      desktop: 1200
    };

    const width = widths[device] || widths.desktop;

    return cloudinary.url(publicId, {
      width,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto'
    });
  }

  /**
   * Get responsive image URLs for all devices
   */
  getResponsiveUrls(publicId) {
    this.ensureConfig();
    return {
      mobile: this.getOptimizedUrl(publicId, 'mobile'),
      tablet: this.getOptimizedUrl(publicId, 'tablet'),
      desktop: this.getOptimizedUrl(publicId, 'desktop'),
      srcset: `
        ${this.getOptimizedUrl(publicId, 'mobile')} 500w,
        ${this.getOptimizedUrl(publicId, 'tablet')} 800w,
        ${this.getOptimizedUrl(publicId, 'desktop')} 1200w
      `.trim()
    };
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId) {
    this.ensureConfig();
    try {
      if (!publicId) return false;
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Image deletion error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }
}

export default new ImageService();
