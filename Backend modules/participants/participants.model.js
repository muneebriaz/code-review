const { Schema, model: Model, Schema: { Types: { ObjectId } } } = require('mongoose')
const paginate = require('mongoose-paginate-v2')
const timestamp = require('mongoose-timestamp2')
const { AuthClass } = require('../../services/auth.service')
const { PRIMARY_PARTNER_STATUS, USER_TYPES, STATUS: { PARTICIPANT } } = require('../../constants')

const ParticipantSchema = new Schema({
  name: {
    type: String,
    reqired: true,
  },
  dob: {
    type: Date,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  hashedPassword: {
    type: String,
  },
  phone: {
    type: String,
    sparse: true,
  },
  address: {
    streetAddress: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
  },
  type: {
    type: String,
    enum: Object.values(USER_TYPES),
    default: USER_TYPES.PRIMARY,
  },
  primaryPartners: [{
    status: {
      type: String,
      enum: Object.values(PRIMARY_PARTNER_STATUS),
      default: PRIMARY_PARTNER_STATUS.INVITED,
    },
    participant: {
      type: ObjectId,
      ref: 'Participants',
    },
  }],
  group: {
    type: ObjectId,
    ref: 'Groups',
    index: true,
  },
  location: {
    type: ObjectId,
    ref: 'Locations',
  },
  stage: {
    type: ObjectId,
    ref: 'Stages',
  },
  providers: [{
    isDefault: { type: Boolean, default: false },
    linkedAt: { type: Date, default: Date.now },
    provider: { type: ObjectId, ref: 'Providers' },
  }],
  dateOfSurgery: {
    type: Date,
  },
  status: {
    type: String,
    enum: Object.values(PARTICIPANT),
    default: PARTICIPANT.INVITED,
  },
  zone: Number,
  preferences: {
    pushNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
  },
})

class ParticipantsClass extends AuthClass {
}
ParticipantSchema.plugin(timestamp)
ParticipantSchema.plugin(paginate)
ParticipantSchema.loadClass(ParticipantsClass)
ParticipantSchema.index({
  _id: 1,
  group: 1,
})
module.exports = Model('Participants', ParticipantSchema)
