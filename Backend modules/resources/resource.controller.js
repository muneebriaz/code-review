const createError = require('http-errors')
const { Types: { ObjectId } } = require('mongoose')
const Resource = require('./resource.model')
const ResourcePositions = require('./resource-positions.model')
const ResourceCategory = require('../resource-categories/resource-categories.model')
const TouchPoint = require('../touch-points/touch-points.model')

const {
  RESOURCE_TYPES, ERROR_REQUIRED_FIELDS, UNAUTHORIZED_MSG,
  STATUS: { RESOURCE: { ACTIVE, REMOVED }, TOUCH_POINT: TOUCH_POINT_STATUS },
} = require('../../constants')
const { getThumbnail } = require('../../services/url-parser.service')
const { getSearchRegex } = require('../../services/utility.service')

const sortResources = async (resources, group) => {
  const sortedResources = []
  const map = new Map()
  resources.forEach((r) => {
    map.set(r._id.toString(), r)
  })
  const rps = await ResourcePositions.find({
    resource: { $in: [...map.keys()] },
    group,
  }).sort('position').select('resource').lean()
    .exec()
  for (const rp of rps) {
    const rId = rp.resource.toString()
    sortedResources.push(map.get(rId))
    map.delete(rId)
  }
  sortedResources.push(...map.values())
  return sortedResources
}

const getReorderedResources = async (ids, group, category) => {
  let query = [
    {
      $match: {
        _id: { $in: ids },
      },
    },
    {
      $project: {
        order: {
          $filter: {
            input: '$order',
            as: 'ord',
            cond: { $eq: ['$$ord.group', ObjectId(group)] },
          },
        },
        headline: 1,
        category: 1,
        media: 1,
        group: 1,
        thumbnail: 1,
        type: 1,
        viewTime: 1,
        status: 1,
      },
    },
    {
      $sort: {
        'order.position': 1,
      },
    },
  ]

  if (category) {
    query = query.concat([{
      $lookup: {
        from: 'resourcecategories',
        localField: 'category',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' }])
  }

  return Resource.aggregate(query)
}

const createResource = async (body) => {
  const resourceData = { ...body }
  if (
    !resourceData.headline || !resourceData.category
    || !Object.values(RESOURCE_TYPES).includes(resourceData.type)
    || !resourceData.media
  ) {
    throw createError(400, ERROR_REQUIRED_FIELDS)
  } else {
    if (!await ResourceCategory.findOne({ _id: resourceData.category, status: ACTIVE })) {
      throw createError(400, 'Resource category doesn\'t exist')
    }

    if (resourceData.type === RESOURCE_TYPES.VIDEO) {
      try {
        resourceData.thumbnail = await getThumbnail(resourceData.media)
      } catch (error) {
        throw createError(400, 'Only Youtube and Vimeo videos are currently supported')
      }

      if (!resourceData.thumbnail) {
        const { picture } = await ResourceCategory.findOne({ _id: resourceData.category }, 'picture').lean()
        resourceData.thumbnail = picture
      }
    }

    const { group } = resourceData

    if (group) {
      const [latestResourcePos] = await Resource
        .find(
          { category: resourceData.category, 'order.group': group },
          { order: { $elemMatch: { group } } },
        )
        .sort({ 'order.position': -1 }).limit(1).lean()

      if (latestResourcePos && latestResourcePos.order) {
        const [order] = latestResourcePos.order
        resourceData.order = [{ position: order.position + 1, group }]
      } else {
        resourceData.order = [{ position: 0, group }]
      }
    }

    let resource = new Resource(resourceData)

    if (!resourceData.isLocationSpecific) {
      resource.location = undefined
    } else if (resourceData.location) {
      resource.location = resourceData.location
    }
    resource = await resource.save()
    return resource
  }
}

const getAllResources = async ({ resourceCategoryId: category, group, location }) => {
  const query = {
    status: ACTIVE,
    category: ObjectId(category),
  }

  if (group) {
    query.$or = [
      { group: ObjectId(group) },
      { group: { $exists: false } },
    ]
  } else query.group = { $exists: false }

  if (location) {
    query.$or = [
      { location: ObjectId(location) },
      { location: { $exists: false } },
    ]
  }

  let resources = await Resource.find(query, 'headline type thumbnail media updatedAt').populate('location')
  if (group) {
    resources = await Resource.aggregate([
      {
        $match: query,
      },
      {
        $project: {
          order: {
            $filter: {
              input: '$order',
              as: 'ord',
              cond: { $eq: ['$$ord.group', ObjectId(group)] },
            },
          },
          headline: 1,
          media: 1,
          thumbnail: 1,
          type: 1,
          location: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: {
          'order.position': 1,
        },
      },
    ])
  }

  return { resources }
}

const getResources = async ({
  resourceCategoryId, group, search = '', sort = 'createdAt', queryPage = 1, queryLimit = 10, location,
}) => {
  // eslint-disable-next-line radix
  const limit = parseInt(queryLimit)
  // eslint-disable-next-line radix
  const page = parseInt(queryPage)
  const resourceCategory = await ResourceCategory.findOne({ _id: resourceCategoryId })
  const query = {
    status: ACTIVE,
    category: ObjectId(resourceCategoryId),
  }
  if (group) {
    if (location) {
      query.$or = [
        { group: ObjectId(group), $or: [{ location: ObjectId(location) }, { location: { $exists: false } }] },
        { group: { $exists: false }, $or: [{ location: ObjectId(location) }, { location: { $exists: false } }] },
      ]
    } else {
      query.$or = [
        { group: ObjectId(group) },
        { group: { $exists: false } },
      ]
    }
  } else {
    if (location) {
      query.$or = [
        { group: { $exists: false }, $or: [{ location: ObjectId(location) }, { location: { $exists: false } }] },
      ]
    } query.group = { $exists: false }
  }

  if (search) {
    const searchRegex = getSearchRegex(search)
    query.headline = searchRegex
  }

  const aggregationSteps = [
    {
      $match: query,
    },
  ]

  if (group) {
    const aggregationQuery = [
      {
        $project: {
          order: {
            $filter: {
              input: '$order',
              as: 'ord',
              cond: { $eq: ['$$ord.group', ObjectId(group)] },
            },
          },
          headline: 1,
          media: 1,
          thumbnail: 1,
          type: 1,
          location: 1,
          updatedAt: 1,
          group: 1
        },
      },
      {
        $sort: {
          'order.position': 1,
        },
      },
    ]
    aggregationSteps.push(...aggregationQuery)
  }

  const [resources, total] = await Promise.all([
    Resource.aggregate(aggregationSteps)
      .skip((page - 1) * limit)
      .limit(limit),
    Resource.count(query)])

  return {
    resources,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    resourceCategory: resourceCategory.name,
  }
}

const getResourceById = async (resourceId) => {
  const resource = await Resource.findOne({ _id: resourceId, status: ACTIVE }).populate('category', 'name').exec()
  if (!resource) throw createError(403, 'Resource not found!')
  return resource
}

const updateResource = async (resourceId, body) => {
  const resourceData = { ...body }
  const resource = await Resource.findOne({ _id: resourceId, status: ACTIVE }).exec()
  if (!resource) {
    throw createError(403, 'Resource not found')
  }
  if (!Object.values(RESOURCE_TYPES).includes(resourceData.type)
    || !resourceData.media
  ) {
    throw createError(400, ERROR_REQUIRED_FIELDS)
  }
  if (resourceData.type === RESOURCE_TYPES.VIDEO) {
    try {
      resourceData.thumbnail = await getThumbnail(resourceData.media)
    } catch (error) {
      throw createError(400, 'Only Youtube and Vimeo videos are currently supported')
    }

    if (!resourceData.thumbnail) {
      const { picture } = await ResourceCategory.findOne({ _id: resource.category }, 'picture').lean()
      resourceData.thumbnail = picture
    }
  }

  if (!resourceData.isLocationSpecific) {
    delete resourceData.location
    resourceData.$unset = { location: '' }
  } else if (resourceData.location) {
    if (resource.location && resource.location.toString() !== resourceData.location.toString()) {
      const touchpointCount = await TouchPoint.count({ target: resourceId, status: TOUCH_POINT_STATUS.ACTIVE })
      if (touchpointCount) {
        throw createError(400, `Location cannot be updated, as this resource is added in ${touchpointCount} touchpoint(s)`)
      }
    }
    resource.location = resourceData.location
  }

  return Resource.findByIdAndUpdate({ _id: resourceId, status: ACTIVE }, resourceData)
}

const updateResourceStatus = async (resourceId, role) => {
  const resource = await Resource.findById(resourceId, 'group category')
  const findResource = await TouchPoint.find({ status: { $ne: TOUCH_POINT_STATUS.REMOVED }, target: resourceId })
  if (findResource.length > 0) {
    throw createError(403, 'Cannot remove the Resource linked with path.')
  }

  if (!resource.group) {
    // Resource created by super-admin
    switch (role) {
      case 'admin': {
        const updatedResource = await Resource.findByIdAndUpdate(resourceId, {
          // eslint-disable-next-line no-unneeded-ternary
          status: REMOVED,
        }, { new: true })
        return updatedResource
      }
      case 'groupAdmin':
        // not allowed
        throw createError(403, 'Group admins are not allowed to update Resources created by Admin(s)')
      default:
        throw createError(403, UNAUTHORIZED_MSG)
    }
  } else {
    // Group based resource category
    switch (role) {
      case 'admin':
        // not allowed
        throw createError(403, 'Admins are not allowed to update group-based Resources')
      case 'groupAdmin': {
        const updatedResource = await Resource.findByIdAndUpdate(resourceId, {
          // eslint-disable-next-line no-unneeded-ternary
          status: REMOVED,
        }, { new: true })
        return updatedResource
      }
      default:
        throw createError(403, UNAUTHORIZED_MSG)
    }
  }
}

const setOrder = async (group, orderedListResources) => {
  await ResourcePositions.bulkWrite(
    orderedListResources.map((resource, position) => ({
      updateOne: {
        filter: { resource, group },
        update: { position },
        upsert: true,
      },
    })),
  )
}

const reorderResources = async (group, resources) => {
  const newOrderResources = resources.map(resource => ({
    updateOne: {
      filter: { _id: resource },
      update: { $pull: { order: { group } } },
    },
  })).concat(resources.map((resource, position) => ({
    updateOne: {
      filter: { _id: resource },
      update: { $addToSet: { order: { position, group } } },
    },
  })))

  await Resource.bulkWrite(
    newOrderResources,
  )
}

module.exports = {
  createResource,
  getResources,
  getAllResources,
  getResourceById,
  updateResource,
  updateResourceStatus,
  setOrder,
  sortResources,
  reorderResources,
  getReorderedResources,
}
