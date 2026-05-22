/**
 * Client-side image compression using Canvas API.
 * Converts to WebP format and iteratively reduces quality until target size is met.
 *
 * @param file - Original File object
 * @param maxSizeMB - Target max file size in MB (default: 1)
 * @param maxWidth - Max pixel width, maintains aspect ratio (default: 1280)
 * @returns Compressed File object (image/webp)
 */
export async function compressImage(
  file: File,
  maxSizeMB = 1,
  maxWidth = 1280
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'))

    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string

      img.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพได้'))

      img.onload = () => {
        const canvas = document.createElement('canvas')

        // Calculate resize dimensions maintaining aspect ratio
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context ไม่พร้อมใช้งาน'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        // Iteratively reduce quality until target size is met
        let quality = 0.9
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('การบีบอัดรูปภาพล้มเหลว'))
                return
              }

              if (blob.size <= maxSizeMB * 1024 * 1024 || quality <= 0.1) {
                const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
                  type: 'image/webp',
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                quality -= 0.1
                tryCompress()
              }
            },
            'image/webp',
            quality
          )
        }
        tryCompress()
      }
    }
  })
}
