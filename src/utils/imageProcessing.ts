export const applyMedicalHeatmap = async (base64Data: string, mimeType: string = 'image/jpeg'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');

      // Draw original image
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Simple implementation of a "Jet" / "Turbo" like colormap
      // Maps grayscale intensity (0-255) to RGB
      const colormap = (gray: number) => {
        let r, g, b;
        if (gray < 64) {
          r = 0; g = 4 * gray; b = 255;
        } else if (gray < 128) {
          r = 0; g = 255; b = 255 - 4 * (gray - 64);
        } else if (gray < 192) {
          r = 4 * (gray - 128); g = 255; b = 0;
        } else {
          r = 255; g = 255 - 4 * (gray - 192); b = 0;
        }
        return [r, g, b];
      };

      for (let i = 0; i < data.length; i += 4) {
        // Calculate luminosity (grayscale value)
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const [r, g, b] = colormap(gray);
        
        // Enhance contrast slightly using clipping
        // We can do this implicitly or just apply the heatmap
        data[i] = Math.min(255, r);
        data[i + 1] = Math.min(255, g);
        data[i + 2] = Math.min(255, b);
        // Alpha is data[i+3], leave it 255
      }

      ctx.putImageData(imageData, 0, 0);
      
      // Get the base64 string
      const resultDataUrl = canvas.toDataURL(mimeType, 0.95);
      // Remove the prefix "data:image/jpeg;base64,"
      const base64Result = resultDataUrl.split(',')[1];
      resolve(base64Result);
    };
    img.onerror = () => reject('Failed to load image for processing');
    img.src = `data:${mimeType};base64,${base64Data}`;
  });
};
