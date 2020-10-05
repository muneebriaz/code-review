const { Schema, model: Model, Schema: { Types: { ObjectId } } } = require('mongoose')
const timestamp = require('mongoose-timestamp2')
const paginate = require('mongoose-paginate-v2')

const {
  RESOURCE_TYPES, STATUS, MODELS: { GROUPS }, RESOURCE_CONTENT_TYPES,
} = require('../../constants')

const ResourceSchema = new Schema({
  headline: {
    type: String,
    required: true,
  },
  media: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(RESOURCE_TYPES),
  },
  category: {
    type: ObjectId,
    ref: 'ResourceCategories',
    required: true,
  },
  description: {
    type: String,
  },
  group: {
    type: ObjectId,
    ref: 'Groups',
    index: true,
  },
  location: {
    type: ObjectId,
    ref: 'Locations',
  },
  thumbnail: {
    type: String,
  },
  viewTime: {
    type: Number,
    min: 1,
  },
  status: {
    type: String,
    enum: Object.values(STATUS.RESOURCE),
    default: STATUS.RESOURCE.ACTIVE,
  },
  order: [
    {
      _id: false,
      group: {
        type: ObjectId,
        ref: GROUPS,
      },
      position: {
        type: Number,
      },
    },
  ],
  resourceContent: [
    {
      _id: false,
      type: { type: String, enum: Object.values(RESOURCE_CONTENT_TYPES) },
      value: { type: String },
    },
  ],
})

class ResourceClass {
}

ResourceSchema.plugin(timestamp)
ResourceSchema.plugin(paginate)
ResourceSchema.loadClass(ResourceClass)

module.exports = Model('Resources', ResourceSchema)
