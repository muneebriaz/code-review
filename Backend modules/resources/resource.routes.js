const express = require('express')
const joi = require('@hapi/joi')
joi.objectId = require('joi-objectid')(joi)
const resourceController = require('./resource.controller')
const {
  auth, allow, allowEither, validate, allowOnly,
} = require('../../middlewares')
const {
  RESOURCE_TYPES, ERROR_MSG, RESOURCE_DESCRIPTION_MAX_SIZE_MBS,
  ROLES: { GROUP_ADMIN },
  RESOURCE_CONTENT_TYPES,
} = require('../../constants')

const router = express.Router()

const validateDescriptionSize = ((req, res, next) => {
  const { description } = req.body

  if (description && description.length / 1024 / 1024 > RESOURCE_DESCRIPTION_MAX_SIZE_MBS) {
    return res.respond(
      400,
      {
        message: 'Description is too large. If you are using images in description, please use smaller in size',
        showMsgFor: 5000,
      },
    )
  }
  return next()
})

router
  .route('/')
  .post(auth,
    allow(['admin', 'groupAdmin']),
    validate({
      body: {
        headline: joi.string().required(),
        media: joi.string().required(),
        type: joi.string().valid(Object.values(RESOURCE_TYPES)).required(),
        category: joi.objectId().required(),
        location: joi.objectId().allow('').optional(),
        viewTime: joi.number().min(1).required(),
        isLocationSpecific: joi.boolean().optional(),
        resourceContent: joi.array().items({
          type: joi.string().valid(Object.values(RESOURCE_CONTENT_TYPES)).required(),
          value: joi.string().required(),
        }),
      },
    }),
    validateDescriptionSize,
    async (req, res) => {
      try {
        const {
          headline, media, type, category, location, viewTime, isLocationSpecific, resourceContent,
        } = req.body
        let group
        if (req.payload.role === 'groupAdmin') group = req.payload.groupId
        const resource = await resourceController.createResource({
          headline, media, type, category, group, location, viewTime, isLocationSpecific, resourceContent,
        })
        res.respond(200, { resource, message: 'Resource created successfully' })
      } catch (err) {
        res.respond(
          err.status || 500,
          {
            message: err.message || ERROR_MSG,
          },
        )
      }
    })

router
  .route('/:resourceId')
  .get(auth, allowEither(
    ['admin', 'groupAdmin', 'participant'],
    { path: 'params.resourceId', model: 'Resources' },
  ),
    validate({
      param: {
        resourceId: joi.string().required(),
      },
    }),
    async (req, res) => {
      try {
        const { resourceId } = req.params
        const resource = await resourceController
          .getResourceById(resourceId)
        res.respond(200, { resource })
      } catch (err) {
        res.status(500).json(err)
      }
    })
  .patch(auth, allow(['admin', 'groupAdmin'], { path: 'params.resourceId', model: 'Resources' }),
    validate({
      param: {
        resourceId: joi.string().required(),
      },
      body: {
        headline: joi.string().required(),
        media: joi.string().required(),
        type: joi.string().valid(Object.values(RESOURCE_TYPES)).required(),
        location: joi.objectId().allow('').optional(),
        viewTime: joi.number().min(1).required(),
        isLocationSpecific: joi.boolean().optional(),
        resourceContent: joi.array().items({
          type: joi.string().valid(Object.values(RESOURCE_CONTENT_TYPES)).required(),
          value: joi.string().required(),
        }),
      },
    }),
    validateDescriptionSize,
    async (req, res) => {
      try {
        const { resourceId } = req.params
        const {
          headline, type, media, location, viewTime, isLocationSpecific, resourceContent,
        } = req.body
        const resource = await resourceController.updateResource(resourceId, {
          headline, type, media, location, viewTime, isLocationSpecific, resourceContent,
        })
        res.respond(200, { resource, message: 'Resource updated successfully' })
      } catch (err) {
        res.respond(
          err.status || 500,
          {
            message: err.message || ERROR_MSG,
          },
        )
      }
    })
  .delete(
    auth,
    allow(['admin', 'groupAdmin'], { path: 'params.resourceId', model: 'Resources' }),
    validate({
      param: {
        resourceId: joi.objectId(),
      },
    }),
    async (req, res) => {
      try {
        const { resourceId } = req.params
        const resource = await resourceController
          .updateResourceStatus(resourceId, req.payload.role)
        res.respond(200, { resource, message: 'Resource status updated successfully' })
      } catch (err) {
        res.respond(
          err.status || 500,
          {
            message: err.message || ERROR_MSG,
          },
        )
      }
    },
  )
router
  .route('/category/:resourceCategoryId')
  .get(auth, allow(['admin', 'groupAdmin']),
    validate({
      param: {
        resourceCategoryId: joi.string().required(),
      },
      query: {
        page: joi.string().optional(),
        limit: joi.string().optional(),
        applicable: joi.string().optional(),
        sort: joi.string().optional(),
        search: joi.string().allow('').optional(),
        location: joi.objectId().optional(),
      },
    }),
    async (req, res) => {
      try {
        const {
          sort, page: queryPage, limit: queryLimit, search, location,
        } = req.query
        const { resourceCategoryId } = req.params
        let group = ''
        // eslint-disable-next-line prefer-destructuring
        if (req.payload.role === 'groupAdmin') group = req.payload.groupId

        const {
          resources, page, totalPages, total, limit, resourceCategory,
        } = await (
          queryLimit
            ? resourceController.getResources({
              resourceCategoryId, group, search, sort, queryPage, queryLimit, location,
            })
            : resourceController.getAllResources({ resourceCategoryId, group, location })
        )

        res.respond(200, {
          resources, page, totalPages, total, limit, resourceCategory,
        })
      } catch (err) {
        res.respond(
          err.status || 500,
          {
            message: err.message || ERROR_MSG,
          },
        )
      }
    })

router
  .route('/order/set')
  .post(
    auth,
    allowOnly(['groupAdmin']),
    validate({
      body: {
        order: joi.array().items(joi.objectId()).required(),
      },
    }),
    async (req, res) => {
      try {
        const { groupId } = req.payload
        const { order } = req.body
        await resourceController.setOrder(groupId, order)
        res.respond(200, { message: 'Successfully updated the resource order' })
      } catch (err) {
        res.respond(
          err.status || 500,
          {
            message: err.message || ERROR_MSG,
          },
        )
      }
    },
  )


router
  .route('/reorder-resources')
  .post(
    auth,
    allow([GROUP_ADMIN]),
    validate({
      body: {
        resources: joi.array().items(joi.string()).required(),
      },
    }),
    async (req, res, next) => {
      try {
        const { groupId } = req.payload
        const { resources } = req.body
        await resourceController.reorderResources(groupId, resources)
        res.respond(200, { message: 'Resources reordered successfully' })
      } catch (err) {
        next(err)
      }
    },
  )
module.exports = router
