const tmp = require('tmp')
const createError = require('http-errors')
const { Types: { ObjectId } } = require('mongoose')
const createCsvWriter = require('csv-writer').createObjectCsvWriter

const randomize = require('randomatic')
const Participants = require('./participants.model')
const Paths = require('../paths/paths.model')
const TouchPoints = require('../touch-points/touch-points.model')
const TouchPointRead = require('../touch-point-read/touch-point-read.model')
const Providers = require('../providers/providers.model')
const Resources = require('../resources/resource.model')
const { sortResources, getReorderedResources } = require('../resources/resource.controller')
const Stages = require('../stages/stages.model')
const InviteCodes = require('../invite-codes/invite-codes.model')
const Attempts = require('../invite-codes/attempts.model')
const Groups = require('../groups/groups.model')
const {
  CONTACT_ADMIN_MSG,
  USER_TYPES,
  STATUS,
  INVALID_CREDENTIALS,
  UNAUTHORIZED_MSG,
  TOUCH_POINT_KIND,
  PRIMARY_PARTNER_STATUS,
  USER_TYPES: { SECONDARY, PRIMARY },
  INVITE_KINDS: { RESET_PASSWORD, INVITE },
  MODELS: { PARTICIPANTS },
  PASSWORD_LENGTH_ERR,
  MAX_ATTEMPTS,
} = require('../../constants')
const Email = require('../../services/email.service')
const Token = require('../../services/token.service')
const { getSearchRegex } = require('../../services/utility.service')
const PathService = require('../../services/path.service')
const { getQuestionnairesProgress } = require('../questionnaires/questionnaires.controller')
const { logout, createSession } = require('../sessions/sessions.controller')

const createParticipant = async (body) => {
  const participantBody = { ...body, status: STATUS.PARTICIPANT.INVITED }
  participantBody.email = participantBody.email && participantBody.email.toLowerCase()
  const existingParticipant = await Participants.count({ email: participantBody.email }).exec()
  if (existingParticipant) {
    throw createError(403, 'The email provided is already registered.')
  }
  const participant = new Participants(participantBody)
  const newParticipant = await participant.save()
  return newParticipant
}

const updateParticipant = async (participantId, {
  name, dob, phone, type, partner, stage, address, dateOfSurgery, location, isLocationSpecific,
}) => {
  const participant = await Participants.findById(participantId).exec()
  if (!participant) {
    throw createError(403, 'Participant not found')
  }

  if (type !== participant.type) {
    // check partner

    switch (participant.type) {
      case USER_TYPES.PRIMARY:
        if (await Participants.count({ 'primaryPartners.participant': participantId })) {
          throw createError(400, 'Type can\'t be changed as it are linked with some other participant')
        }
        break

      case USER_TYPES.SECONDARY:
        if (participant.status === STATUS.PARTICIPANT.ACTIVE) {
          throw createError(400, 'Type of active secondary partner can\'t be updated')
        }
        break

      default:
        break
    }
  }

  const secondaryQuery = {}
  if (name) participant.name = name
  if (dob) participant.dob = dob
  if (phone) participant.phone = phone
  if (type) participant.type = type
  if (partner) participant.partner = partner
  if (stage) {
    participant.stage = stage
    secondaryQuery.stage = stage
  }
  if (address) participant.address = address
  if (dateOfSurgery) {
    participant.dateOfSurgery = dateOfSurgery
    secondaryQuery.dateOfSurgery = dateOfSurgery
  }

  if (!isLocationSpecific) {
    participant.location = undefined
    secondaryQuery.location = undefined
  } else if (location) {
    participant.location = location
    secondaryQuery.location = location
  }

  const [updatedParticipant] = await Promise.all([
    participant.save(),
    Participants.findOneAndUpdate({ primaryPartners: { $elemMatch: { participant: participant._id } } }, { $set: secondaryQuery }),
  ])

  return updatedParticipant
}

const mergePrimaryIntoSecondary = (participant) => {
  if (participant.primaryPartners && participant.primaryPartners.length) {
    // TODO: implement support for multiple primary partners
    const linkedPrimaryPartner = participant.primaryPartners[0].participant
    // eslint-disable-next-line no-param-reassign
    participant.stage = linkedPrimaryPartner.stage
    // eslint-disable-next-line no-param-reassign
    participant.dateOfSurgery = linkedPrimaryPartner.dateOfSurgery
    // eslint-disable-next-line no-param-reassign
    participant.location = linkedPrimaryPartner.location
  }
}

const checkAttempts = async (participant, kind, inviteCodeExists) => {
  const attempts = await Attempts.findOne({ participant, kind })
  const errorMsg = 'You\'ve reached maximum number of attempts. Try again later.'
  if (!inviteCodeExists) {
    if (!attempts) {
      await Attempts.create({ participant, kind })
    }
    if (attempts && attempts.count < MAX_ATTEMPTS) {
      await Attempts.findOneAndUpdate({ participant, kind }, { $inc: { count: 1 } })
    }
    if (attempts && attempts.count === MAX_ATTEMPTS) {
      throw createError(403, errorMsg)
    }
    throw createError(403, 'Invalid invite code.')
  } else if (inviteCodeExists) {
    if (attempts && attempts.count === MAX_ATTEMPTS) {
      throw createError(403, errorMsg)
    }
    await Attempts.remove({ participant, kind })
  }
}

const getParticipants = async ({ group, search, providerId }, sort = 'createdAt', queryPage = 1, queryLimit = 10) => {
  let query = {}
  if (providerId) {
    query = { 'providers.provider': ObjectId(providerId) }
  }
  if (group) query.group = group
  if (search) {
    const searchRegex = getSearchRegex(search)
    query.$or = [
      { name: searchRegex },
      { phone: searchRegex },
    ]
  }

  const {
    docs: participants, page, limit, totalDocs: total, totalPages,
  } = await Participants.paginate(query, {
    sort,
    page: queryPage,
    limit: queryLimit,
    lean: true,
    select: '-hashedPassword',
    populate: [
      { path: 'stage' },
      {
        path: 'primaryPartners.participant',
        populate: {
          path: 'stage',
        },
      },
    ],
  })

  const secondaryParticipants = participants.filter(p => p.type === USER_TYPES.SECONDARY)
  secondaryParticipants.forEach(sp => mergePrimaryIntoSecondary(sp))

  return {
    participants, page, limit, total, totalPages,
  }
}

const exportParticipants = async ({ group, search, providerId }) => {
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })

  let query = {}
  if (group) query.group = group
  if (providerId) { query = { 'providers.provider': providerId } }
  if (search) {
    const searchRegex = getSearchRegex(search)
    query.$or = [
      { name: searchRegex },
      { phone: searchRegex },
    ]
  }

  const participants = await Participants.find(query).populate([
    { path: 'stage' },
    {
      path: 'primaryPartners.participant',
      populate: 'stage',
    },
    {
      path: 'providers.provider',
      select: 'name',
    },
  ]).lean().exec()

  const header = [
    { id: '_id', title: 'ID' },
    { id: 'name', title: 'Name' },
    { id: 'email', title: 'Email' },
    { id: 'status', title: 'Status' },
    { id: 'type', title: 'Type' },
    { id: 'stage', title: 'Stage' },
    { id: 'provider', title: 'Surgeon' },
    { id: 'partner', title: 'Partner' },
    { id: 'address', title: 'Address' },
  ]

  const path = `${tmpDir.name}/participants.csv`
  const csvWriter = createCsvWriter({
    path,
    header,
  })
  await csvWriter.writeRecords(participants.map((p) => {
    const defaultProvider = p.providers && p.providers.length ? p.providers.find(provider => provider.isDefault).provider : null
    const partner = p.primaryPartners && p.primaryPartners.length ? p.primaryPartners[0].participant : null
    if (partner) { partner.stage = partner.stage || {} }

    p.address = p.address || {}
    const {
      streetAddress = '', city = '', state = '', zip = '',
    } = p.address

    return {
      ...p,
      stage: p.stage.name,
      provider: defaultProvider ? `${defaultProvider.name} (${defaultProvider._id})` : '',
      partner: partner ? `${partner.name} - ${partner.stage.name} - (${partner._id})` : '',
      address: `${streetAddress} ${city} ${state} ${zip}`,
    }
  }))
  return path
}

const getParticipantDetails = async (participantId) => {
  const [participant, linkedPartner] = await Promise.all([
    Participants.findById(participantId)
      .select('-hashedPassword')
      .populate('stage')
      .populate({
        path: 'primaryPartners.participant',
        select: '-hashedPassword',
        populate: [
          { path: 'stage' },
        ],
      })
      .lean(),
    Participants.findOne({
      'primaryPartners.participant': participantId,
    }).populate('stage'),
  ])
  mergePrimaryIntoSecondary(participant)
  if (participant.type === USER_TYPES.PRIMARY) {
    participant.linkedPartner = linkedPartner || {}
  } else {
    participant.linkedPartner = participant.primaryPartners.length ? participant.primaryPartners[0].participant : {}
  }
  delete participant.primaryPartners
  return participant
}

const suspendParticipant = async (participantId, status = STATUS.PARTICIPANT.SUSPENDED) => {
  const participant = await Participants
    .findByIdAndUpdate({ _id: participantId }, { status }, { new: true }).exec()
  return participant
}

const linkProvider = async (participantId, providerId, groupId) => {
  const existingProvider = await Providers.count({ _id: providerId, group: groupId }).exec()
  if (!existingProvider) {
    throw createError(403, 'Surgeon does not exist')
  }
  const existingParticipant = await Participants.findById(participantId).exec()
  const providerObj = { provider: providerId }
  if (!existingParticipant.providers.length) providerObj.isDefault = true
  const participant = await Participants.findByIdAndUpdate(
    { _id: participantId },
    {
      $addToSet: {
        providers: providerObj,
      },
    },
    {
      new: true,
    },
  )
  return participant.toJSON()
}

const unlinkProvider = async (participantId, providerId, groupId) => {
  const existingProvider = await Providers.count({ _id: providerId, group: groupId }).exec()
  if (!existingProvider) {
    throw createError(403, 'Surgeon does not exist')
  }
  const participant = await Participants.findByIdAndUpdate(
    { _id: participantId },
    {
      $pull: {
        providers: { provider: providerId },
      },
    },
    {
      new: true,
    },
  )
  return participant.toJSON()
}


const getLinkedProviders = async (participantId) => {
  const participant = await Participants.findById(participantId)
    .populate('providers.provider', '-hashedPassword')
    .lean()
    .exec()
  const providers = participant.providers.map(p => ({
    ...p.provider,
    isDefault: p.isDefault,
    linkedAt: p.linkedAt,
  }))
  return providers
}

const getUnlinkedProviders = async (participantId, group, sort = 'createdAt', queryPage = 1, queryLimit = 10) => {
  const participant = await Participants.findById(participantId)
    .exec()
  const providerIds = participant.providers.map(p => p.provider)
  const {
    docs: unlinkedProviders, page, limit, totalDocs: total, totalPages,
  } = await Providers.paginate({
    _id: {
      $nin: providerIds || [],
    },
    group,
    status: {
      $ne: STATUS.PROVIDER.REMOVED,
    },
  }, {
    sort,
    page: queryPage,
    limit: queryLimit,
    lean: true,
    select: '-hashedPassword',
  })
  return {
    unlinkedProviders, page, limit, total, totalPages,
  }
}

const inviteParticipant = async (body) => {
  const participantBody = { ...body }
  participantBody.email = participantBody.email && participantBody.email.toLowerCase()
  const { email, group } = participantBody
  const existingParticipant = await Participants.count({ email }).exec()
  if (existingParticipant) {
    throw createError(403, 'The email provided is already registered.')
  }
  if (!participantBody.location) delete participantBody.location
  const participant = new Participants(participantBody)
  const code = randomize('0', 6)
  const inviteCodeBody = { participant: participant._id, code }
  if (participantBody.type === USER_TYPES.SECONDARY
    && participantBody.primaryPartners.length) inviteCodeBody.primaryPartner = participantBody.primaryPartners[0].participant
  const invite = new InviteCodes(inviteCodeBody)
  await Promise.all([invite.save(), participant.save()])
  // TODO: change invite flow implementaion on confirmation by Axia
  const { name } = await Groups.findOne({ _id: group }).select('name').exec()
  const emailToSend = new Email(email, 'participantInvite', { inviteCode: code, group: name })
  await emailToSend.send()
  return participant
}

const resendInvite = async (email) => {
  // eslint-disable-next-line no-param-reassign
  email = email.toLowerCase()
  const participant = await Participants.findOne({ email, status: STATUS.PARTICIPANT.INVITED }).exec()
  if (!participant) {
    throw createError(403, 'No invite found against this email address')
  }
  const savedGroup = await Groups.findById(participant.group).exec()
  if (!savedGroup) {
    throw createError(401, UNAUTHORIZED_MSG)
  }
  await InviteCodes.remove({ participant: participant._id })
  const code = randomize('0', 6)
  const invite = await InviteCodes.create({ participant: participant._id, code })
  const emailToSend = new Email(email, 'participantInvite', { inviteCode: code, group: savedGroup.name })
  await emailToSend.send()
  return invite
}

const verifyInvite = async ({ email, inviteCode: code }) => {
  // eslint-disable-next-line no-param-reassign
  email = email.toLowerCase()
  const participant = await Participants.findOne({ email, status: STATUS.PARTICIPANT.INVITED })
    .select('_id type name email group dateOfSurgery')
    .populate('stage')
  if (!participant) throw createError(403, 'The participant is already active or doesn\'t exist anymore.')
  const savedGroup = await Groups.findOne({ _id: participant.group, archived: false })
  if (!savedGroup) {
    throw createError(401, UNAUTHORIZED_MSG)
  }
  const inviteCode = await InviteCodes.findOne({ participant: participant._id, code })
  await checkAttempts(participant._id, INVITE, inviteCode)

  if (inviteCode.primaryPartner) {
    const activePrimaryPartner = await Participants
      .findOne({ _id: inviteCode.primaryPartner, status: STATUS.PARTICIPANT.ACTIVE }).exec()
    if (!activePrimaryPartner) throw createError(403, 'No active primary partner found')
  }
  const session = await createSession(participant._id, PARTICIPANTS)
  const tokenBody = {
    id: participant._id,
    groupId: participant.group,
    role: 'participant',
    type: participant.type,
    sessionId: session._id,
  }
  if (inviteCode.primaryPartner) tokenBody.primaryPartner = inviteCode.primaryPartner
  const token = await Token.generateToken(tokenBody)
  await InviteCodes.remove({ participant: participant._id, code })

  return {
    participant: await Participants.findById(participant._id).populate('group').populate('stage').lean()
      .exec(),
    token,
  }
}

const completeSignup = async (participantId, sessionId, primaryPartnerId, data) => {
  // eslint-disable-next-line no-param-reassign
  data.supportPersonEmail = data.supportPersonEmail && data.supportPersonEmail.toLowerCase()
  const { supportPersonEmail, password } = data
  const participant = await Participants.findOne({ _id: participantId, status: STATUS.PARTICIPANT.INVITED })
    .select('_id type name email group dateOfSurgery location')
    .populate('stage')
  if (!participant) throw createError(403, 'The participant is already active or doesn\'t exist anymore.')
  if (password.length < 6) throw createError(403, PASSWORD_LENGTH_ERR)
  const savedGroup = await Groups.findOne({ _id: participant.group, archived: false })
  if (!savedGroup) {
    throw createError(401, UNAUTHORIZED_MSG)
  }
  if (participant.type === PRIMARY && supportPersonEmail) {
    const supportPerson = await Participants.findOne({ email: supportPersonEmail })
    if (supportPerson) throw createError(403, 'Unable to add this user as support person')
    else {
      const supportPersonBody = {
        name: data.supportPersonName,
        email: data.supportPersonEmail,
        group: participant.group,
        stage: participant.stage._id,
        type: SECONDARY,
        dateOfSurgery: participant.dateOfSurgery,
        primaryPartners: [{
          participant: participant._id,
        }],
      }
      if (participant.location) supportPersonBody.location = participant.location
      // eslint-disable-next-line no-unused-vars
      const invitedSupportPerson = await inviteParticipant(supportPersonBody)
    }
  }
  participant.name = data.name
  participant.password = data.password
  participant.status = STATUS.PARTICIPANT.ACTIVE
  if (primaryPartnerId) {
    await Participants.updateOne({ _id: participantId, 'primaryPartners.participant': primaryPartnerId }, {
      $set: { 'primaryPartners.$.status': PRIMARY_PARTNER_STATUS.ACTIVE },
    })
  }
  const [savedParticipant] = await Promise.all([participant.save(), logout(sessionId)])
  return savedParticipant
}

const authenticateParticipant = async ({ email, password }) => {
  let participant = await Participants.findOne({ email: email.toLowerCase(), status: STATUS.PARTICIPANT.ACTIVE })
    .select('_id type name email group dateOfSurgery hashedPassword')
    .populate([
      { path: 'stage' },
      { path: 'group', select: 'name' },
      { path: 'primaryPartners.participant' },
    ])
    .exec()
  if (!participant) {
    throw createError(401, INVALID_CREDENTIALS)
  }
  // TODO: populate primary participants/ return support persons
  const passwordMatch = await participant.validatePassword(password)
  if (!passwordMatch) {
    throw createError(401, INVALID_CREDENTIALS)
  }
  const savedGroup = await Groups.findOne({ _id: participant.group, archived: false })
  if (!savedGroup) {
    throw createError(401, UNAUTHORIZED_MSG)
  }

  participant = participant.toJSON()
  if (
    participant.type === USER_TYPES.SECONDARY
    && (
      (!participant.primaryPartners || !participant.primaryPartners.length)
      || (
        participant.primaryPartners.length
        && participant.primaryPartners[0].participant.status === STATUS.PARTICIPANT.SUSPENDED
      )
    )
  ) {
    throw createError(403, 'No active primary partner linked')
  }
  delete participant.primaryPartners

  const session = await createSession(participant._id, PARTICIPANTS)
  const token = await Token.generateToken({
    id: participant._id, groupId: participant.group, role: 'participant', type: participant.type, sessionId: session._id,
  })
  return { token, participant }
}

const requestResetPassword = async (email) => {
  const participant = await Participants.findOne({ email: email.toLowerCase(), status: STATUS.PARTICIPANT.ACTIVE }).exec()
  if (!participant) throw createError(403, 'Not any account found against this email')

  const savedGroup = await Groups.findOne({ _id: participant.group, archived: false })
  if (!savedGroup) throw createError(400, CONTACT_ADMIN_MSG)

  await InviteCodes.remove({ participant: participant._id, kind: RESET_PASSWORD })
  const code = randomize('0', 4)

  const emailToSend = new Email(email, 'participantResetPassword', { code })
  return Promise.all([
    InviteCodes.create({ participant: participant._id, code, kind: RESET_PASSWORD }),
    emailToSend.send(),
  ])
}

const resetPassword = async ({ email, code, password }) => {
  const participant = await Participants.findOne({ email: email.toLowerCase(), status: STATUS.PARTICIPANT.ACTIVE }).exec()
  if (!participant) {
    throw createError(403, 'No participant exists against this email.')
  }
  if (password.length < 6) throw createError(403, PASSWORD_LENGTH_ERR)
  const savedGroup = await Groups.findOne({ _id: participant.group, archived: false })
  if (!savedGroup) {
    throw createError(401, UNAUTHORIZED_MSG)
  }

  const inviteCode = await InviteCodes.findOne({ participant: participant._id, code, kind: RESET_PASSWORD })
  await checkAttempts(participant._id, RESET_PASSWORD, inviteCode)

  participant.password = password

  return Promise.all([
    inviteCode.remove(),
    participant.save(),
  ])
}

const verifyPasscode = async ({ email, code }) => {
  const errorMsg = 'Invalid code. Kindly request again for password reset.'
  const participant = await Participants.findOne({ email: email.toLowerCase(), status: STATUS.PARTICIPANT.ACTIVE }).exec()
  if (!participant) {
    throw createError(403, errorMsg)
  }
  const savedGroup = await Groups.findOne({ _id: participant.group, archived: false })
  if (!savedGroup) {
    throw createError(403, errorMsg)
  }
  if (!participant) {
    throw createError(403, errorMsg)
  }
  const inviteCode = await InviteCodes.findOne({ participant: participant._id, code, kind: RESET_PASSWORD })
  await checkAttempts(participant._id, RESET_PASSWORD, inviteCode)

  return inviteCode
}

const getMyProfile = async (participantId) => {
  const existingParticipant = await Participants.findOne({ _id: participantId, status: STATUS.PARTICIPANT.ACTIVE })
    .select('_id type name email address dateOfSurgery preferences')
    .populate('stage').populate('location')
  if (!existingParticipant) throw createError(403, 'No participant found')
  const supportPersons = await Participants.find({
    'primaryPartners.participant': existingParticipant._id,
    status: { $ne: STATUS.PARTICIPANT.SUSPENDED },
  }).select('name email status')
  const participant = existingParticipant.toJSON()
  participant.supportPersons = supportPersons
  return participant
}

const getMyTasks = async (participant) => {
  const savedParticipant = await Participants.findOne({ _id: participant, status: STATUS.PARTICIPANT.ACTIVE }).populate('stage', 'name')
  if (!savedParticipant) throw createError(403, 'No participant found')
  const {
    group, type: userType, stage, dateOfSurgery, location, zone,
  } = savedParticipant
  const { _id: stageId, name: stageName } = stage

  const paths = await PathService.getPaths(group, location, userType, stageId)
  const userPeriod = PathService.calculatePeriod(stageName, dateOfSurgery, zone)
  const pathIds = paths.map(p => p._id)

  const [resourceTPs, questionnaireTPs] = await Promise.all([
    PathService.getUserTouchPoints(TOUCH_POINT_KIND.RESOURCE, userPeriod, stageName, pathIds, group),
    PathService.getUserTouchPoints(TOUCH_POINT_KIND.QUESTIONNAIRE, userPeriod, stageName, pathIds, group),
  ])

  const touchPoints = [...resourceTPs, ...questionnaireTPs]
  const tpReads = await TouchPointRead.find({
    participant,
    touchPoint: { $in: resourceTPs.map(tp => tp._id) },
  }).lean()

  const resources = []
  const questionnaires = []

  for (const tp of touchPoints) {
    // eslint-disable-next-line default-case
    switch (tp.kind) {
      case TOUCH_POINT_KIND.RESOURCE:
        tp.isRead = tpReads.some(tpr => tpr.touchPoint.toString() === tp._id.toString())
        resources.push(tp)
        break

      case TOUCH_POINT_KIND.QUESTIONNAIRE:
        questionnaires.push(tp)
        break
    }
  }

  const questionnaireProgressMap = await getQuestionnairesProgress(participant, questionnaires.map(q => q.target._id))
  questionnaires.map((q) => {
    // eslint-disable-next-line no-param-reassign
    q.progress = questionnaireProgressMap[q.target._id.toString()]
    return q
  })

  const resourceTps = await getReorderedResources(resources.map(r => r.target), group, false)

  const map = new Map()
  resources.forEach((r) => {
    map.set(r.target.toString(), r)
  })

  const sortedResources = []
  resourceTps.forEach((tp) => {
    let r
    r = map.get(tp._id.toString())
    r.target = tp
    sortedResources.push(r)
  })

  return {
    stage,
    period: userPeriod,
    questionnaires,
    toDoList: sortedResources,
  }
}

const updateMyProfile = async (participantId, body) => {
  const participant = await Participants.findOne({ _id: participantId, status: STATUS.PARTICIPANT.ACTIVE })
    .select('_id type name email address stage dateOfSurgery preferences')
    .exec()
  if (!participant) {
    throw createError(403, 'Participant not found')
  }
  if (
    body.stage
    && participant.stage
    && participant.stage.toString() !== body.stage) {
    await Participants.updateMany(
      { 'primaryPartners.participant': participant._id },
      { $set: { stage: body.stage } },
    )
  }

  for (const k of ['name', 'address', 'stage', 'preferences', 'dateOfSurgery']) {
    if (body[k]) {
      participant[k] = body[k]
    }
  }

  let updatedParticipant = await participant.save()
  updatedParticipant = updatedParticipant.toJSON()

  const stage = await Stages.findById(participant.stage)
  updatedParticipant.stage = stage

  return updatedParticipant
}

const removeSupportPerson = async (participantId, supportPersonId) => {
  const supportPerson = await Participants.findById(supportPersonId)
  if (!supportPerson) throw createError(403, 'Support person not found')
  if (supportPerson.status === STATUS.PARTICIPANT.INVITED) {
    await Participants.findByIdAndUpdate({ _id: supportPersonId }, {
      status: STATUS.PARTICIPANT.SUSPENDED,
    })
  } else if (supportPerson.status === STATUS.PARTICIPANT.ACTIVE) {
    await Participants.findByIdAndUpdate({ _id: supportPersonId }, {
      status: STATUS.PARTICIPANT.SUSPENDED,
      $pull: { primaryPartners: { participant: participantId } },
    })
  }
  return supportPerson
}

const addSupportPerson = async (participantId, { supportPersonName, supportPersonEmail }) => {
  // eslint-disable-next-line no-param-reassign
  supportPersonEmail = supportPersonEmail && supportPersonEmail.toLowerCase()
  const participant = await Participants.findOne({ _id: participantId, status: STATUS.PARTICIPANT.ACTIVE })
  if (!participant) throw createError(405, 'Participant not found')
  const supportPerson = await Participants.findOne({ email: supportPersonEmail })
  let invitedSupportPerson = {}
  if (supportPerson) throw createError(405, 'Unable to add this user as support person')
  else {
    const supportPersonBody = {
      name: supportPersonName,
      email: supportPersonEmail,
      group: participant.group,
      stage: participant.stage,
      type: SECONDARY,
      dateOfSurgery: participant.dateOfSurgery,
      primaryPartners: [{
        participant: participantId,
      }],
    }
    if (participant.location) supportPersonBody.location = participant.location
    // eslint-disable-next-line no-unused-vars
    invitedSupportPerson = await inviteParticipant(supportPersonBody)
  }
  return invitedSupportPerson
}

const updateSupportPerson = async (supportPersonId, name, participantId) => {
  const supportPerson = await Participants.findById(supportPersonId).exec()
  if (!supportPerson) throw createError(403, 'Support person not found')
  if (supportPerson.status === STATUS.PARTICIPANT.ACTIVE) throw createError(403, 'You can\'t update an active support person')
  const primaryExists = supportPerson.primaryPartners.some(pp => pp.participant.toString() === participantId)
  if (!primaryExists) throw createError(403, 'Support person is not linked')
  supportPerson.name = name
  return supportPerson.save()
}

const checkParticipantBelongsToGroup = async (participantId, groupId) => {
  const count = await Participants.count({
    _id: participantId,
    group: groupId,
    status: STATUS.PARTICIPANT.ACTIVE,
  }).exec()
  return Boolean(count)
}

const getResourceLibrary = async (participantId, stageId) => {
  const participant = await Participants.findOne({
    _id: participantId,
    status: STATUS.PARTICIPANT.ACTIVE,
  }).select('group location type').exec()

  if (!participant) { throw createError(403, 'Participant doesn\'t exist') }

  const { group, location, type: userType } = participant

  const paths = await Paths.find({
    userType,
    stage: stageId,
    $and: [
      {
        $or: [{ group }, { group: { $exists: false } }],
      },
      {
        $or: [{ location }, { location: { $exists: false } }],
      },
    ],
    status: STATUS.PATH.ACTIVE,
  }).exec()

  if (paths.find(p => p.location)) {
    const index = paths.findIndex(p => !p.location && p.group)
    if (index !== -1) {
      paths.splice(index, 1)
    }
  }
  const tps = await TouchPoints.find({
    path: { $in: paths.map(p => p._id) },
    disabledFor: { $ne: group },
    replacedFor: { $ne: group },
    $or: [{ group }, { group: { $exists: false } }],
    status: STATUS.TOUCH_POINT.ACTIVE,
    kind: TOUCH_POINT_KIND.RESOURCE,
  }).sort('period').lean()

  const resourcesTps = await getReorderedResources(tps.map(t => t.target), group, true)

  const tpRead = await TouchPointRead.find({
    touchPoint: { $in: tps.map(tp => tp._id) },
    participant,
  })

  const map = new Map()
  tps.forEach((r) => {
    map.set(r.target.toString(), r._id.toString())
  })

  const readSet = new Set(tpRead.map(tpR => tpR.touchPoint.toString()))

  const resources = []

  resourcesTps.forEach((tp) => {
    let r
    r = tp
    r.touchPoint = map.get(tp._id.toString())
    r.isRead = readSet.has(tp.touchPoint.toString())
    r.category = { _id: r.category._id, name: r.category.name }
    resources.push(r)
  })

  return resources
}

const searchResourceLibrary = async (participantId, searchString) => {
  const participant = await Participants.findOne({
    _id: participantId,
    status: STATUS.PARTICIPANT.ACTIVE,
  }).select('group location type').lean().exec()

  if (!participant) { throw createError(403, 'Participant doesn\'t exist') }

  const { group, location, type: userType } = participant

  const paths = await Paths.find({
    userType,
    $and: [
      {
        $or: [{ group }, { group: { $exists: false } }],
      },
      {
        $or: [{ location }, { location: { $exists: false } }],
      },
    ],
    status: STATUS.PATH.ACTIVE,
  }).select('stage location group').lean().exec()
  const stagePathsMap = {}
  paths.forEach((p) => {
    const key = p.stage.toString()
    if (!stagePathsMap[key]) {
      stagePathsMap[key] = []
    }
    stagePathsMap[key].push(p)
  })
  const pathIds = []
  Object.keys(stagePathsMap).forEach((stageId) => {
    const stagePaths = stagePathsMap[stageId]
    if (stagePaths.find(sP => sP.location)) {
      const index = stagePaths.findIndex(sP => !sP.location && sP.group)
      if (index !== -1) {
        stagePaths.splice(index, 1)
      }
    }
    pathIds.push(...(stagePaths.map(sP => sP._id)))
  })
  const tps = await TouchPoints.find({
    path: { $in: pathIds },

    disabledFor: { $ne: group },
    replacedFor: { $ne: group },

    $or: [{ group }, { group: { $exists: false } }],

    status: STATUS.TOUCH_POINT.ACTIVE,
    kind: TOUCH_POINT_KIND.RESOURCE,
  }).select('target').lean().exec()
  const resources = await Resources.find({
    _id: { $in: tps.map(tp => tp.target) },
    headline: {
      $regex: searchString,
      $options: 'i',
    },
  }).select('-resourceContent').populate('category', 'name').lean()
    .exec()
  return sortResources(resources, group)
}

const getLinkedProvider = async (participantId) => {
  const participant = await Participants.findOne({ _id: participantId, status: STATUS.PARTICIPANT.ACTIVE })
    .populate({
      path: 'providers.provider',
      select: '-hashedPassword',
    }).lean().exec()
  if (!participant) { throw createError(405, 'Participant doesn\'t exist.') }
  const providerError = 'Participant is not linked with any surgeon'
  if (!participant.providers.length) {
    throw createError(405, providerError)
  }
  const defaultProvider = participant.providers.find(p => p.isDefault && p.provider.status !== STATUS.PROVIDER.REMOVED)
  if (!defaultProvider) {
    return participant.providers[0].provider
  }
  return defaultProvider.provider
}

const getPartnersNumbers = async (participantId) => {
  const participant = await Participants.findOne({ _id: participantId, status: STATUS.PARTICIPANT.ACTIVE })
    .lean().exec()
  if (!participant) { throw createError(403, 'Participant doesn\'t exist.') }
  const partnerQuery = {
    status: STATUS.PARTICIPANT.ACTIVE,
  }
  if (participant.type === USER_TYPES.PRIMARY) {
    partnerQuery.primaryPartners = {
      $elemMatch: {
        status: PRIMARY_PARTNER_STATUS.ACTIVE,
        participant: participant._id,
      },
    }
  } else {
    const { primaryPartners } = participant
    const queryIds = primaryPartners.filter(p => p.status === PRIMARY_PARTNER_STATUS.ACTIVE)
      .map(p => p.participant)
    partnerQuery._id = { $in: queryIds }
  }
  const partners = await Participants.find(partnerQuery).select('phone name').exec()
  return partners.filter(p => p.phone)
}

const setDefaultProvider = async (participantId, providerId, groupId) => {
  const existingProvider = await Providers.count({ _id: providerId, group: groupId }).exec()
  if (!existingProvider) {
    throw createError(403, 'Surgeon does not exist')
  }
  const participantProviders = await Participants.findOne({ _id: participantId }).exec()
  if (!participantProviders.providers.length
    || !participantProviders.providers.some(p => p.provider.toString() === providerId)) {
    throw createError(403, 'Surgeon is not linked with participant')
  }
  await Participants.update(
    {
      _id: participantId,
      providers: { $elemMatch: { provider: { $ne: providerId } } },
    },
    {
      'providers.$.isDefault': false,
    },
  )
  const participant = await Participants.findOneAndUpdate(
    {
      _id: participantId,
      'providers.provider': providerId,
    },
    {
      $set: {
        'providers.$.isDefault': true,
      },
    },
    {
      new: true,
    },
  )
  return participant
}

module.exports = {
  getMyTasks,
  createParticipant,
  updateParticipant,
  getParticipants,
  getParticipantDetails,
  suspendParticipant,
  linkProvider,
  unlinkProvider,
  getLinkedProviders,
  getUnlinkedProviders,
  inviteParticipant,
  verifyInvite,
  completeSignup,
  resendInvite,
  authenticateParticipant,
  requestResetPassword,
  resetPassword,
  getMyProfile,
  updateMyProfile,
  removeSupportPerson,
  addSupportPerson,
  updateSupportPerson,
  verifyPasscode,
  checkParticipantBelongsToGroup,
  getResourceLibrary,
  searchResourceLibrary,
  getLinkedProvider,
  getPartnersNumbers,
  setDefaultProvider,
  exportParticipants,
}
