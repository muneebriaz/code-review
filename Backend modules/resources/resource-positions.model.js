const { Schema, model: Model, Schema: { Types: { ObjectId } } } = require('mongoose')
const timestamp = require('mongoose-timestamp2')

const ResourcePositionSchema = new Schema({
  group: {
    type: ObjectId,
    ref: 'Groups',
  },
  resource: {
    type: ObjectId,
    ref: 'Resources',
  },
  position: {
    type: Number,
  },
})

class ResourcePositionClass { }


ResourcePositionSchema.plugin(timestamp)
ResourcePositionSchema.loadClass(ResourcePositionClass)
ResourcePositionSchema.index({ group: 1, resource: 1 }, { unique: true })

module.exports = Model('ResourcePositions', ResourcePositionSchema)
