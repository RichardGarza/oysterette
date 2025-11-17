/**
 * Upload Service Unit Tests
 *
 * Tests image upload functionality with Cloudinary mocking:
 * - File size validation (5MB limit)
 * - Format validation (jpg, jpeg, png, webp)
 * - Cloudinary upload success/failure
 * - Image transformation parameters
 * - Profile vs review photo optimizations
 * - Error handling and edge cases
 */

import { uploadImage, uploadProfilePhoto, uploadReviewPhoto, deleteImage } from '../uploadService';

// Mock Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

import { v2 as cloudinary } from 'cloudinary';

describe('Upload Service', () => {
  const mockCloudinaryResponse = {
    secure_url: 'https://res.cloudinary.com/test/image/upload/v123/oysterette/test.jpg',
    public_id: 'oysterette/test',
    format: 'jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload image successfully with default options', async () => {
      const mockBuffer = Buffer.from('fake-image-data');

      // Mock upload_stream to call callback with success
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponse);
          return {
            end: jest.fn(),
          };
        }
      );

      const result = await uploadImage(mockBuffer);

      expect(result).toBe(mockCloudinaryResponse.secure_url);
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'oysterette',
          transformation: expect.arrayContaining([
            expect.objectContaining({
              width: 800,
              height: 800,
              crop: 'fill',
              quality: 80,
              fetch_format: 'auto',
            }),
          ]),
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        }),
        expect.any(Function)
      );
    });

    it('should upload image with custom options', async () => {
      const mockBuffer = Buffer.from('fake-image-data');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponse);
          return {
            end: jest.fn(),
          };
        }
      );

      await uploadImage(mockBuffer, {
        folder: 'custom-folder',
        width: 1200,
        height: 900,
        crop: 'fit',
        quality: 90,
      });

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'custom-folder',
          transformation: expect.arrayContaining([
            expect.objectContaining({
              width: 1200,
              height: 900,
              crop: 'fit',
              quality: 90,
            }),
          ]),
        }),
        expect.any(Function)
      );
    });

    it('should reject files larger than 5MB', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

      await expect(uploadImage(largeBuffer)).rejects.toThrow();

      expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
    });

    it('should accept files exactly at 5MB limit', async () => {
      const maxBuffer = Buffer.alloc(5 * 1024 * 1024); // Exactly 5MB

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponse);
          return {
            end: jest.fn(),
          };
        }
      );

      const result = await uploadImage(maxBuffer);

      expect(result).toBe(mockCloudinaryResponse.secure_url);
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalled();
    });

    it('should accept files smaller than 5MB', async () => {
      const smallBuffer = Buffer.alloc(1024 * 1024); // 1MB

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponse);
          return {
            end: jest.fn(),
          };
        }
      );

      const result = await uploadImage(smallBuffer);

      expect(result).toBe(mockCloudinaryResponse.secure_url);
    });

    it('should handle Cloudinary upload errors', async () => {
      const mockBuffer = Buffer.from('fake-image-data');
      const uploadError = new Error('Cloudinary API error');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(uploadError, null);
          return {
            end: jest.fn(),
          };
        }
      );

      await expect(uploadImage(mockBuffer)).rejects.toThrow('Failed to upload image');
    });

    it('should handle network errors during upload', async () => {
      const mockBuffer = Buffer.from('fake-image-data');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(new Error('Network timeout'), null);
          return {
            end: jest.fn(),
          };
        }
      );

      await expect(uploadImage(mockBuffer)).rejects.toThrow('Failed to upload image');
    });

    it('should handle empty buffer', async () => {
      const emptyBuffer = Buffer.from('');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponse);
          return {
            end: jest.fn(),
          };
        }
      );

      const result = await uploadImage(emptyBuffer);

      expect(result).toBe(mockCloudinaryResponse.secure_url);
    });

    it('should pass buffer to upload stream', async () => {
      const mockBuffer = Buffer.from('test-image-data');
      const mockEnd = jest.fn();

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponse);
          return {
            end: mockEnd,
          };
        }
      );

      await uploadImage(mockBuffer);

      expect(mockEnd).toHaveBeenCalledWith(mockBuffer);
    });

    it('should set allowed formats correctly', async () => {
      const mockBuffer = Buffer.from('fake-image-data');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponse);
          return {
            end: jest.fn(),
          };
        }
      );

      await uploadImage(mockBuffer);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        }),
        expect.any(Function)
      );
    });

    it('should set fetch_format to auto for optimization', async () => {
      const mockBuffer = Buffer.from('fake-image-data');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponse);
          return {
            end: jest.fn(),
          };
        }
      );

      await uploadImage(mockBuffer);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          transformation: expect.arrayContaining([
            expect.objectContaining({
              fetch_format: 'auto',
            }),
          ]),
        }),
        expect.any(Function)
      );
    });
  });

  describe('uploadProfilePhoto', () => {
    it('should upload with profile-specific optimizations', async () => {
      const mockBuffer = Buffer.from('profile-photo-data');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, {
            ...mockCloudinaryResponse,
            secure_url: 'https://res.cloudinary.com/test/oysterette/profiles/photo.jpg',
          });
          return {
            end: jest.fn(),
          };
        }
      );

      const result = await uploadProfilePhoto(mockBuffer);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'oysterette/profiles',
          transformation: expect.arrayContaining([
            expect.objectContaining({
              width: 400,
              height: 400,
              crop: 'fill',
              quality: 85,
            }),
          ]),
        }),
        expect.any(Function)
      );
      expect(result).toContain('profiles');
    });

    it('should reject oversized profile photos', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      await expect(uploadProfilePhoto(largeBuffer)).rejects.toThrow();
    });

    it('should use square aspect ratio for profile photos', async () => {
      const mockBuffer = Buffer.from('profile-photo-data');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponse);
          return {
            end: jest.fn(),
          };
        }
      );

      await uploadProfilePhoto(mockBuffer);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          transformation: expect.arrayContaining([
            expect.objectContaining({
              width: 400,
              height: 400,
            }),
          ]),
        }),
        expect.any(Function)
      );
    });

    it('should use higher quality for profile photos', async () => {
      const mockBuffer = Buffer.from('profile-photo-data');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponse);
          return {
            end: jest.fn(),
          };
        }
      );

      await uploadProfilePhoto(mockBuffer);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          transformation: expect.arrayContaining([
            expect.objectContaining({
              quality: 85, // Higher than default 80
            }),
          ]),
        }),
        expect.any(Function)
      );
    });
  });

  describe('uploadReviewPhoto', () => {
    it('should upload with review-specific optimizations', async () => {
      const mockBuffer = Buffer.from('review-photo-data');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, {
            ...mockCloudinaryResponse,
            secure_url: 'https://res.cloudinary.com/test/oysterette/reviews/photo.jpg',
          });
          return {
            end: jest.fn(),
          };
        }
      );

      const result = await uploadReviewPhoto(mockBuffer);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'oysterette/reviews',
          transformation: expect.arrayContaining([
            expect.objectContaining({
              width: 1200,
              height: 900,
              crop: 'fit',
              quality: 80,
            }),
          ]),
        }),
        expect.any(Function)
      );
      expect(result).toContain('reviews');
    });

    it('should use landscape aspect ratio for review photos', async () => {
      const mockBuffer = Buffer.from('review-photo-data');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponse);
          return {
            end: jest.fn(),
          };
        }
      );

      await uploadReviewPhoto(mockBuffer);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          transformation: expect.arrayContaining([
            expect.objectContaining({
              width: 1200,
              height: 900,
              crop: 'fit', // Maintains aspect ratio
            }),
          ]),
        }),
        expect.any(Function)
      );
    });

    it('should reject oversized review photos', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      await expect(uploadReviewPhoto(largeBuffer)).rejects.toThrow();
    });
  });

  describe('deleteImage', () => {
    it('should delete image by extracting public_id from URL', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      });

      const url = 'https://res.cloudinary.com/test/image/upload/v123/oysterette/test123.jpg';

      await deleteImage(url);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('oysterette/test123');
    });

    it('should handle profiles folder correctly', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      });

      const url = 'https://res.cloudinary.com/test/image/upload/v123/oysterette/profiles/user456.jpg';

      await deleteImage(url);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('profiles/user456');
    });

    it('should handle reviews folder correctly', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      });

      const url = 'https://res.cloudinary.com/test/image/upload/v123/oysterette/reviews/review789.jpg';

      await deleteImage(url);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('reviews/review789');
    });

    it('should handle deletion errors gracefully without throwing', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(
        new Error('Not found')
      );

      const url = 'https://res.cloudinary.com/test/image/upload/v123/oysterette/test.jpg';

      // Should not throw
      await expect(deleteImage(url)).resolves.toBeUndefined();
    });

    it('should handle invalid URL format gracefully', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      });

      const invalidUrl = 'https://invalid-url.com';

      // Should not throw
      await expect(deleteImage(invalidUrl)).resolves.toBeUndefined();

      // Should not call destroy with invalid data
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('should handle URL with no filename', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      });

      const url = 'https://res.cloudinary.com/test/image/upload/v123/';

      await deleteImage(url);

      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('should handle URL with no folder', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      });

      const url = 'https://res.cloudinary.com/test.jpg';

      await deleteImage(url);

      // May still call destroy with malformed public_id, that's okay
      // The important part is it doesn't throw
    });

    it('should handle network errors during deletion', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const url = 'https://res.cloudinary.com/test/image/upload/v123/oysterette/test.jpg';

      // Should not throw
      await expect(deleteImage(url)).resolves.toBeUndefined();
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle Buffer with special characters', async () => {
      const specialBuffer = Buffer.from('💾🖼️📷');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponse);
          return {
            end: jest.fn(),
          };
        }
      );

      const result = await uploadImage(specialBuffer);

      expect(result).toBe(mockCloudinaryResponse.secure_url);
    });

    it('should handle concurrent upload requests', async () => {
      const buffer1 = Buffer.from('image1');
      const buffer2 = Buffer.from('image2');
      const buffer3 = Buffer.from('image3');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponse);
          return {
            end: jest.fn(),
          };
        }
      );

      const results = await Promise.all([
        uploadImage(buffer1),
        uploadImage(buffer2),
        uploadImage(buffer3),
      ]);

      expect(results).toHaveLength(3);
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledTimes(3);
    });

    it('should enforce file size limit for all upload types', async () => {
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024);

      await expect(uploadImage(largeBuffer)).rejects.toThrow();
      await expect(uploadProfilePhoto(largeBuffer)).rejects.toThrow();
      await expect(uploadReviewPhoto(largeBuffer)).rejects.toThrow();
    });

    it('should validate transformation parameters are positive', async () => {
      const mockBuffer = Buffer.from('test');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockCloudinaryResponse);
          return {
            end: jest.fn(),
          };
        }
      );

      await uploadImage(mockBuffer, {
        width: 800,
        height: 800,
        quality: 80,
      });

      const call = (cloudinary.uploader.upload_stream as jest.Mock).mock.calls[0][0];
      expect(call.transformation[0].width).toBeGreaterThan(0);
      expect(call.transformation[0].height).toBeGreaterThan(0);
      expect(call.transformation[0].quality).toBeGreaterThan(0);
    });
  });
});
