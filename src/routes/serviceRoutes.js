const express = require("express");
const router = express.Router();
const Joi = require("joi");
const serviceController = require("../controllers/serviceController");
const { isAdminOrSecretary } = require("../middlewares/auth");
const { validate, schemas } = require("../middlewares/validation");
const upload = require("../middlewares/upload");
const asyncHandler = require("../middlewares/asyncHandler");
const { csrfProtection } = require("../middlewares/csrf");
const parseFormData = require("../middlewares/parseFormData");

// Get all services (public)
router.get(
  "/",
  validate(
    schemas.pagination.keys({
      search: Joi.string().allow(""),
      categoryId: Joi.string().uuid(),
      categorySlug: Joi.string().allow(""),
    }),
    "query"
  ),
  asyncHandler(serviceController.getServices)
);

// Get single service (public)
router.get("/:identifier", asyncHandler(serviceController.getService));

// Create service (Admin/Secretary)
router.post(
  "/",
  isAdminOrSecretary,
  csrfProtection,
  upload.single("coverImage"),
  parseFormData("categoryIds", "price", "durationMinutes"),
  validate(
    Joi.object({
      title: Joi.string().required().messages({
        "any.required": "عنوان الزامی است",
      }),
      description: Joi.string().required().messages({
        "any.required": "توضیحات الزامی است",
      }),
      beforeTreatmentTips: Joi.string().allow(""),
      afterTreatmentTips: Joi.string().allow(""),
      price: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().custom((value) => {
          const num = parseInt(value);
          if (isNaN(num)) throw new Error("Invalid number");
          return num;
        })
      ),
      durationMinutes: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().custom((value) => {
          const num = parseInt(value);
          if (isNaN(num)) throw new Error("Invalid number");
          return num;
        })
      ),
      categoryIds: Joi.alternatives()
        .try(
          Joi.array().items(Joi.string().uuid()),
          Joi.string()
            .uuid()
            .custom((value, helpers) => {
              // Convert single UUID to array
              return [value];
            }, "Convert UUID to array")
        )
        .allow(null, "")
        .custom((value, helpers) => {
          // If it's null or empty, return null
          if (
            value === null ||
            value === "" ||
            (Array.isArray(value) && value.length === 0)
          ) {
            return null;
          }
          // If it's already an array, validate each item
          if (Array.isArray(value)) {
            const uuidRegex =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            for (const item of value) {
              if (!uuidRegex.test(item)) {
                return helpers.error("any.invalid");
              }
            }
            return value;
          }
          // If it's a single UUID string, convert to array
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(value)) {
            return [value];
          }
          return helpers.error("any.invalid");
        }, "Validate and normalize categoryIds"),
    })
  ),
  asyncHandler(serviceController.createService)
);

// Update service (Admin/Secretary)
router.patch(
  "/:id",
  isAdminOrSecretary,
  csrfProtection,
  upload.single("coverImage"),
  parseFormData("categoryIds", "price", "durationMinutes"),
  validate(
    Joi.object({
      title: Joi.string(),
      description: Joi.string(),
      beforeTreatmentTips: Joi.string().allow(""),
      afterTreatmentTips: Joi.string().allow(""),
      price: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().custom((value) => {
          const num = parseInt(value);
          if (isNaN(num)) throw new Error("Invalid number");
          return num;
        })
      ),
      durationMinutes: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().custom((value) => {
          const num = parseInt(value);
          if (isNaN(num)) throw new Error("Invalid number");
          return num;
        })
      ),
      categoryIds: Joi.alternatives()
        .try(
          Joi.array().items(Joi.string().uuid()),
          Joi.string()
            .uuid()
            .custom((value, helpers) => {
              // Convert single UUID to array
              return [value];
            }, "Convert UUID to array")
        )
        .allow(null, "")
        .custom((value, helpers) => {
          // If it's null or empty, return null
          if (
            value === null ||
            value === "" ||
            (Array.isArray(value) && value.length === 0)
          ) {
            return null;
          }
          // If it's already an array, validate each item
          if (Array.isArray(value)) {
            const uuidRegex =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            for (const item of value) {
              if (!uuidRegex.test(item)) {
                return helpers.error("any.invalid");
              }
            }
            return value;
          }
          // If it's a single UUID string, convert to array
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(value)) {
            return [value];
          }
          return helpers.error("any.invalid");
        }, "Validate and normalize categoryIds"),
      removeCoverImage: Joi.string().valid("true", "false").optional(),
    })
  ),
  asyncHandler(serviceController.updateService)
);

// Delete service (Admin/Secretary)
router.delete(
  "/:id",
  isAdminOrSecretary,
  csrfProtection,
  asyncHandler(serviceController.deleteService)
);

module.exports = router;
