import { MessageAttachment } from '../../types';
import { DatasetEngine } from '../dataset-engine';

export class FileParser {
  static MAX_FILE_SIZE = 50 * 1024 * 1024; // Generous 50MB limit with streaming/chunking

  static async parseFile(file: File): Promise<MessageAttachment> {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File "${file.name}" exceeds the maximum limit of 50MB.`);
    }

    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    const isVideo = file.type.startsWith('video/');
    const isDataset = DatasetEngine.isDataset(file.name, file.type);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    const attachment: MessageAttachment = {
      id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
    };

    // 1. Large Datasets (CSV/TSV/JSON): compute local metadata and statistics
    if (isDataset) {
      const profile = await DatasetEngine.profileDataset(file);
      attachment.textContent = profile.summaryText;
      return attachment;
    }

    // 2. Images: read and downscale client-side to prevent memory bloat
    if (isImage) {
      const dataUrl = await this.readAndCompressImage(file);
      attachment.dataUrl = dataUrl;
      return attachment;
    }

    // 3. Audio & Video
    if (isAudio || isVideo) {
      attachment.textContent = `[Attached Media: ${file.name} (${file.type}), Size: ${(
        file.size /
        (1024 * 1024)
      ).toFixed(2)} MB]`;
      return attachment;
    }

    // 4. PDFs
    if (isPdf) {
      try {
        if (file.size <= 10 * 1024 * 1024) {
          const dataUrl = await this.readAsDataUrl(file);
          attachment.dataUrl = dataUrl;
        }
        const textSample = await this.readAsText(file.slice(0, 100000));
        attachment.textContent = `[Attached Document: ${file.name}, Size: ${(
          file.size / 1024
        ).toFixed(1)} KB]\n${textSample.slice(0, 20000)}`;
      } catch {
        attachment.textContent = `[Attached Document: ${file.name}, Size: ${(
          file.size / 1024
        ).toFixed(1)} KB]`;
      }
      return attachment;
    }

    // 5. Code & Text Files
    try {
      const text = await this.readAsText(file.slice(0, 500000));
      attachment.textContent = text.slice(0, 35000);
      return attachment;
    } catch {
      attachment.textContent = `[Attached file: ${file.name}, size: ${(file.size / 1024).toFixed(
        1
      )} KB]`;
      return attachment;
    }
  }

  private static readAndCompressImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1280;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  private static readAsDataUrl(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file as data url'));
      reader.readAsDataURL(file);
    });
  }

  private static readAsText(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file as text'));
      reader.readAsText(file);
    });
  }
}
