/**
 * Compresses and resizes an image file in the browser using HTML5 Canvas.
 * Produces a lightweight JPEG Data URL to prevent database overflow and improve upload speeds.
 *
 * @param {File} file - The uploaded image File object
 * @param {number} maxWidth - Maximum width in pixels (default 800)
 * @param {number} maxHeight - Maximum height in pixels (default 800)
 * @param {number} quality - JPEG compression quality from 0 to 1 (default 0.72)
 * @returns {Promise<string>} Base64 data URL of the compressed JPEG image
 */
export const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.72) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided.'));
    }

    if (!file.type || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not a valid image.'));
    }

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(event.target.result);
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (e) {
          resolve(event.target.result);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
};
