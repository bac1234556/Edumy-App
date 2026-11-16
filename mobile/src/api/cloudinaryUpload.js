import axios from 'axios';

const API_BASE_URL = 'http://10.0.2.2:8080/api/v1'; // 10.0.2.2 cho Android Emulator

/**
 * 1. Gọi backend lấy chữ ký upload
 */
export const getCloudinarySignature = async (folder = 'edumy/courses') => {
  const response = await axios.post(`${API_BASE_URL}/instructor/media/signature?folder=${folder}`);
  return response.data.data;
};

/**
 * 2. Upload file trực tiếp lên Cloudinary có thanh % tiến độ
 */
export const uploadToCloudinary = (fileUri, resourceType, signatureData, onProgress) => {
  return new Promise((resolve, reject) => {
    const { signature, timestamp, apiKey, cloudName, folder } = signatureData;
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    // Lắng nghe phần trăm tiến độ
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        resolve({
          url: response.secure_url,
          publicId: response.public_id,
          duration: response.duration ? Math.round(response.duration) : 0,
        });
      } else {
        reject(new Error(`Tải lên thất bại với mã lỗi HTTP: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Lỗi kết nối mạng khi tải tệp lên Cloudinary.'));
    xhr.ontimeout = () => reject(new Error('Quá thời gian kết nối (Timeout).'));

    const formData = new FormData();
    const filename = fileUri.split('/').pop() || (resourceType === 'video' ? 'video.mp4' : 'image.jpg');
    const match = /\.(\w+)$/.exec(filename);
    const mimeType = match ? `${resourceType}/${match[1]}` : `${resourceType}/jpeg`;

    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: mimeType,
    });
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);

    xhr.send(formData);
  });
};