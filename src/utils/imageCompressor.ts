// Client-side automatic image compression helper (max 1000px dimension, ~50-100KB output)
export const compressImageFile = (
  file: File,
  maxDimension = 1000,
  quality = 0.65
): Promise<{ dataUrl: string; originalKb: number; compressedKb: number }> => {
  return new Promise((resolve) => {
    const originalKb = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        let compressedKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        if (compressedKb > originalKb) {
          compressedKb = originalKb;
        }
        resolve({ dataUrl, originalKb, compressedKb });
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  });
};
