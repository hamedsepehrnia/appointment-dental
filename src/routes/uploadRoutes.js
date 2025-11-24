const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middlewares/upload');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload image for CKEditor
 *     description: Upload an image file that will be used in CKEditor. Returns the full URL of the uploaded image.
 *     tags: [Upload]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Image file to upload (jpg, jpeg, png, webp)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: http://localhost:4000/uploads/images/upload-1234567890-123456789.jpg
 *       400:
 *         description: Invalid file or no file provided
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  upload.single('file'),
  asyncHandler(uploadController.uploadImage)
);

module.exports = router;

