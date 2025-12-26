/**
 * @fileoverview Server and channel validation schemas using Joi
 * @module validators/serverValidator
 */

const Joi = require('joi');

/**
 * Create server schema
 */
const createServerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Server name is required',
      'string.min': 'Server name must be at least 2 characters',
      'string.max': 'Server name cannot exceed 100 characters',
      'any.required': 'Server name is required',
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
  icon: Joi.string()
    .uri()
    .allow(null, '')
    .messages({
      'string.uri': 'Icon must be a valid URL',
    }),
  banner: Joi.string()
    .uri()
    .allow(null, '')
    .messages({
      'string.uri': 'Banner must be a valid URL',
    }),
  isPublic: Joi.boolean()
    .default(true),
  tags: Joi.array()
    .items(Joi.string().trim().max(30))
    .max(10)
    .messages({
      'array.max': 'Cannot have more than 10 tags',
    }),
});

/**
 * Update server schema
 */
const updateServerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .messages({
      'string.empty': 'Server name cannot be empty',
      'string.min': 'Server name must be at least 2 characters',
      'string.max': 'Server name cannot exceed 100 characters',
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
  icon: Joi.string()
    .uri()
    .allow(null, '')
    .messages({
      'string.uri': 'Icon must be a valid URL',
    }),
  banner: Joi.string()
    .uri()
    .allow(null, '')
    .messages({
      'string.uri': 'Banner must be a valid URL',
    }),
  isPublic: Joi.boolean(),
  tags: Joi.array()
    .items(Joi.string().trim().max(30))
    .max(10)
    .messages({
      'array.max': 'Cannot have more than 10 tags',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Create channel schema
 */
const createChannelSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Channel name is required',
      'string.min': 'Channel name must be at least 1 character',
      'string.max': 'Channel name cannot exceed 100 characters',
      'any.required': 'Channel name is required',
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
  type: Joi.string()
    .valid('text', 'voice', 'announcements')
    .default('text')
    .messages({
      'any.only': 'Channel type must be text, voice, or announcements',
    }),
  isPrivate: Joi.boolean()
    .default(false),
});

/**
 * Update channel schema
 */
const updateChannelSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .messages({
      'string.empty': 'Channel name cannot be empty',
      'string.min': 'Channel name must be at least 1 character',
      'string.max': 'Channel name cannot exceed 100 characters',
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
  isPrivate: Joi.boolean(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

module.exports = {
  createServerSchema,
  updateServerSchema,
  createChannelSchema,
  updateChannelSchema,
};


