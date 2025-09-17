<?php

namespace App\Services;

use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ImageService
{
    protected $manager;

    public function __construct()
    {
        $this->manager = new ImageManager(new Driver());
    }

    /**
     * Compress and optimize image
     */
    public function compressImage(UploadedFile $file, string $path, int $quality = 80, int $maxWidth = 1920, int $maxHeight = 1080): string
    {
        try {
            // Create image instance
            $image = $this->manager->read($file->getPathname());
            
            // Resize if image is too large
            if ($image->width() > $maxWidth || $image->height() > $maxHeight) {
                $image->resize($maxWidth, $maxHeight, function ($constraint) {
                    $constraint->aspectRatio();
                    $constraint->upsize();
                });
            }
            
            // Generate unique filename
            $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
            $fullPath = $path . '/' . $filename;
            
            // Save compressed image
            $image->save(Storage::disk('public')->path($fullPath), $quality);
            
            return $fullPath;
            
        } catch (\Exception $e) {
            Log::error('Image compression failed: ' . $e->getMessage());
            
            // Fallback to original file
            $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
            $fullPath = $path . '/' . $filename;
            
            Storage::disk('public')->putFileAs($path, $file, $filename);
            
            return $fullPath;
        }
    }

    /**
     * Create thumbnail from image
     */
    public function createThumbnail(string $imagePath, int $width = 300, int $height = 300): string
    {
        try {
            $fullPath = Storage::disk('public')->path($imagePath);
            
            if (!file_exists($fullPath)) {
                throw new \Exception('Image file not found');
            }
            
            $image = $this->manager->read($fullPath);
            
            // Create thumbnail
            $image->resize($width, $height, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });
            
            // Generate thumbnail path
            $pathInfo = pathinfo($imagePath);
            $thumbnailPath = $pathInfo['dirname'] . '/thumbnails/' . $pathInfo['basename'];
            
            // Ensure thumbnail directory exists
            $thumbnailDir = Storage::disk('public')->path($pathInfo['dirname'] . '/thumbnails');
            if (!is_dir($thumbnailDir)) {
                mkdir($thumbnailDir, 0755, true);
            }
            
            // Save thumbnail
            $image->save(Storage::disk('public')->path($thumbnailPath), 80);
            
            return $thumbnailPath;
            
        } catch (\Exception $e) {
            Log::error('Thumbnail creation failed: ' . $e->getMessage());
            return $imagePath; // Return original path if thumbnail creation fails
        }
    }

    /**
     * Delete image and its thumbnail
     */
    public function deleteImage(string $imagePath): bool
    {
        try {
            // Delete main image
            if (Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            
            // Delete thumbnail if exists
            $pathInfo = pathinfo($imagePath);
            $thumbnailPath = $pathInfo['dirname'] . '/thumbnails/' . $pathInfo['basename'];
            
            if (Storage::disk('public')->exists($thumbnailPath)) {
                Storage::disk('public')->delete($thumbnailPath);
            }
            
            return true;
            
        } catch (\Exception $e) {
            Log::error('Image deletion failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get image metadata
     */
    public function getImageMetadata(string $imagePath): array
    {
        try {
            $fullPath = Storage::disk('public')->path($imagePath);
            
            if (!file_exists($fullPath)) {
                return [];
            }
            
            $image = $this->manager->read($fullPath);
            
            return [
                'width' => $image->width(),
                'height' => $image->height(),
                'size' => Storage::disk('public')->size($imagePath),
                'mime_type' => mime_content_type($fullPath),
            ];
            
        } catch (\Exception $e) {
            Log::error('Image metadata extraction failed: ' . $e->getMessage());
            return [];
        }
    }
} 