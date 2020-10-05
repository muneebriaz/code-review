const express = require('express')
const joi = require('@hapi/joi')
joi.objectId = require('joi-objectid')(joi)

const {
  ERROR_MSG, STATES, ROLES: {
    GROUP_ADMIN, PARTICIPANT, PROVIDER, ADMIN,
  }, TOUCH_POINT_ACTIONS,
} = require('../../constants')
const {
  auth, allow, validate, supportPersonAccess, validateProviderParticipant,
} = require('../../middlewares')

const ParticipantsController = require('./participants.controller')
const { markTouchpointRead } = require('../touch-point-read/touch-point-read.controller')

const router = express.Router()

router
  .route('/me')
  .get(auth, allow([PARTICIPANT]), supportPersonAccess, async (req, res) => {
    try {
      const participant = await ParticipantsController.getMyProfile(req.payload.id)
      res.respond(
        200,
        {
          participant,
          message: 'Profile fetched successfully.',
        },
      )
    } catch (err) {
      res.respond(
        err.status || 500,
        {
          message: err.message || ERROR_MSG,
        },
      )
    }
  })
  .patch(auth, allow([PARTICIPANT]),
    validate({
      body: {
        name: joi.string().optional(),
        stage: joi.objectId().optional(),
        dateOfSurgery: joi.string().optional(),
        address: joi.object().keys({
          streetAddress: joi.string().allow('').optional(),
          city: joi.string().allow('').optional(),
          state: joi.string().allow('').optional(),
          zip: joi.string().allow('').optional(),
        }),
        preferences: joi.object().keys({
          pushNotifications: joi.boolean().optional(),
          emailNotifications: joi.boolean().optional(),
        }),
      },
    }),
    async (req, res) => {
      try {
        const {
          name, stage, address, preferences, dateOfSurgery,
        } = req.body
        const participant = await ParticipantsController.updateMyProfile(req.payload.id, {
          name, stage, address, preferences, dateOfSurgery,
        })
        res.respond(
          200,
          {
            participant,
            message: 'Profile updated successfully.',
          },
        )
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
  .route('/tasks')
  .get(
    auth,
    allow([PARTICIPANT]),
    supportPersonAccess,
    async (req, res) => {
      try {
        const { id: participantId } = req.payload
        const tasks = await ParticipantsController.getMyTasks(participantId)

        res.respond(
          200,
          tasks,
        )
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
  .route('/states')
  .get(auth, allow([PARTICIPANT, GROUP_ADMIN, ADMIN]), supportPersonAccess, async (req, res) => {
    try {
      res.respond(
        200,
        {
          states: STATES,
          message: 'States fetched successfully.',
        },
      )
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
  .route('/tasks/:taskId/:action')
  .post(
    auth,
    allow([PARTICIPANT]),
    supportPersonAccess,
    validate({
      param: {
        taskId: joi.objectId(),
        action: joi.string().valid(Object.values(TOUCH_POINT_ACTIONS)).required(),
      },
    }),
    async (req, res) => {
      try {
        const { id: participantId } = req.payload
        const { taskId: touchPointId, action } = req.params

        await markTouchpointRead(touchPointId, participantId, action)

        res.respond(200, { message: `Task has been marked as ${action} successfully` })
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
  .route('/support-person/:supportPersonId')
  .delete(auth,
    allow([PARTICIPANT]),
    validate({
      param: {
        supportPersonId: joi.objectId(),
      },
    }),
    async (req, res) => {
      try {
        const { id: participantId } = req.payload
        const { supportPersonId } = req.params
        const supportPerson = await ParticipantsController.removeSupportPerson(participantId, supportPersonId)
        res.respond(
          200,
          {
            supportPerson,
            message: 'Support person removed successfully.',
          },
        )
      } catch (err) {
        res.respond(
          err.status || 500,
          {
            message: err.message || ERROR_MSG,
          },
        )
      }
    })
  .patch(auth,
    allow([PARTICIPANT]),
    validate({
      param: {
        supportPersonId: joi.objectId(),
      },
      body: {
        name: joi.string().required(),
      },
    }),
    async (req, res) => {
      try {
        const { id: participantId } = req.payload
        const { supportPersonId } = req.params
        const { name } = req.body
        const supportPerson = await ParticipantsController.updateSupportPerson(supportPersonId, name, participantId)
        res.respond(
          200,
          {
            supportPerson,
            message: 'Support person updated successfully.',
          },
        )
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
  .route('/add-support-person')
  .post(auth,
    allow([PARTICIPANT]),
    validate({
      body: {
        supportPersonEmail: joi.string().email().required(),
        supportPersonName: joi.string().required(),
      },
    }),
    async (req, res) => {
      try {
        const { id: participantId } = req.payload
        const { supportPersonName, supportPersonEmail } = req.body
        const supportPerson = await ParticipantsController.addSupportPerson(participantId, { supportPersonName, supportPersonEmail })
        res.respond(
          200,
          {
            supportPerson,
            message: 'Support person added successfully.',
          },
        )
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
  .route('/')
  .get(auth, allow([GROUP_ADMIN, PROVIDER]),
    validate({
      query: {
        sort: joi.string().optional(),
        page: joi.number().optional(),
        limit: joi.number().optional(),
        search: joi.string().allow('').optional(),
      },
    }),
    async (req, res) => {
      try {
        const { groupId, id, role } = req.payload
        const {
          sort, page: queryPage, limit: queryLimit, ...query
        } = req.query
        if (role === PROVIDER) query.providerId = id
        const {
          participants, page, totalPages, total, limit,
        } = await ParticipantsController.getParticipants({ ...query, group: groupId }, sort, queryPage, queryLimit)
        res.respond(200, {
          participants, page, totalPages, total, limit,
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
  .post(auth,
    allow([GROUP_ADMIN]),
    validate({
      body: {
        name: joi.string().required(),
        email: joi.string().required(),
        dateOfSurgery: joi.string().required(),
        stage: joi.objectId().required(),
        address: joi.object().keys({
          streetAddress: joi.string().allow('').optional(),
          city: joi.string().allow('').optional(),
          state: joi.string().allow('').optional(),
          zip: joi.string().allow('').optional(),
        }),
        phone: joi.string().allow('').optional(),
        dob: joi.string().allow('').optional(),
        location: joi.objectId().allow('').optional(),
      },
    }), async (req, res) => {
      try {
        const {
          name, email, address, phone, dateOfSurgery, dob, location, stage,
        } = req.body
        const { groupId: group } = req.payload
        const invitedParticipant = await ParticipantsController.inviteParticipant({
          name, email, address, phone, dateOfSurgery, dob, group, location, stage,
        })
        res.respond(
          200,
          {
            participant: invitedParticipant,
            message: 'An invitation to participant has been sent.',
          },
        )
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
  .route('/data/export')
  .get(auth, allow([GROUP_ADMIN, PROVIDER]),
    validate({
      query: {
        search: joi.string().allow('').optional(),
      },
    }),
    async (req, res) => {
      try {
        const { groupId, id: userId, role } = req.payload
        const { search } = req.query

        const filePath = await ParticipantsController.exportParticipants({
          search, group: groupId, providerId: role === PROVIDER ? userId : '',
        })

        res.download(filePath)
      } catch (err) {
        res.respond(err.status || 500, { message: err.message || ERROR_MSG })
      }
    })

router
  .route('/:participantId')
  .get(auth,
    allow([GROUP_ADMIN, PROVIDER], { path: 'params.participantId', model: 'Participants' }),
    validateProviderParticipant({ source: 'params' }),
    async (req, res) => {
      try {
        const { participantId } = req.params
        const participant = await ParticipantsController.getParticipantDetails(participantId)
        res.respond(200, { participant })
      } catch (err) {
        res.respond(
          err.status || 500,
          {
            message: err.message || ERROR_MSG,
          },
        )
      }
    })
  .patch(auth, allow([GROUP_ADMIN], { path: 'params.participantId', model: 'Participants' }), async (req, res) => {
    try {
      const { participantId } = req.params
      const participant = await ParticipantsController.updateParticipant(participantId, req.body)
      res.respond(200, { participant, message: 'Participant details updated successfully' })
    } catch (err) {
      res.respond(
        err.status || 500,
        {
          message: err.message || ERROR_MSG,
        },
      )
    }
  })
  .delete(auth, allow([GROUP_ADMIN], { path: 'params.participantId', model: 'Participants' }), async (req, res) => {
    try {
      const { participantId } = req.params
      const { status } = req.query
      const participant = await ParticipantsController.suspendParticipant(participantId, status)
      res.respond(200, { participant, message: 'Participant status updated successfully' })
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
  .route('/:participantId/linkProvider')
  .post(auth,
    validate({
      body: {
        provider: joi.string().required(),
      },
    }), allow([GROUP_ADMIN], { path: 'params.participantId', model: 'Participants' }), async (req, res) => {
      try {
        const { participantId } = req.params
        const { groupId } = req.payload
        const { provider } = req.body
        const participant = await ParticipantsController.linkProvider(participantId, provider, groupId)
        res.respond(200, { participant, message: 'Surgeon linked successfully' })
      } catch (err) {
        res.respond(
          err.status || 500,
          {
            message: err.message || ERROR_MSG,
          },
        )
      }
    })
  .get(auth, allow([GROUP_ADMIN], { path: 'params.participantId', model: 'Participants' }), async (req, res) => {
    try {
      const { participantId } = req.params
      const providers = await ParticipantsController.getLinkedProviders(participantId)
      res.respond(200, { providers })
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
  .route('/:participantId/unlinkProvider')
  .get(auth, allow([GROUP_ADMIN], { path: 'params.participantId', model: 'Participants' }),
    async (req, res) => {
      try {
        const { participantId } = req.params
        const { groupId } = req.payload
        const { sort, page: queryPage, limit: queryLimit } = req.query
        const {
          unlinkedProviders, page, totalPages, total, limit,
        } = await ParticipantsController.getUnlinkedProviders(participantId, groupId, sort, queryPage, queryLimit)
        res.respond(200, {
          unlinkedProviders, page, totalPages, total, limit,
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
  .post(auth,
    validate({
      body: {
        provider: joi.string().required(),
      },
    }), allow([GROUP_ADMIN], { path: 'params.participantId', model: 'Participants' }), async (req, res) => {
      try {
        const { participantId } = req.params
        const { groupId } = req.payload
        const { provider } = req.body
        const participant = await ParticipantsController.unlinkProvider(participantId, provider, groupId)
        res.respond(200, { participant, message: 'Surgeon unlinked successfully' })
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
  .route('/:participantId/defaultProvider/:providerId')
  .post(auth,
    validate({
      params: {
        participantId: joi.string().required(),
        providerId: joi.string().required(),
      },
    }), allow([GROUP_ADMIN], { path: 'params.participantId', model: 'Participants' }), async (req, res) => {
      try {
        const { participantId, providerId } = req.params
        const { groupId } = req.payload
        await ParticipantsController.setDefaultProvider(participantId, providerId, groupId)
        const providers = await ParticipantsController.getLinkedProviders(participantId)
        res.respond(200, { providers, message: 'Surgeon marked as default successfully' })
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
  .route('/verify')
  .post(validate({
    body: {
      email: joi.string().required(),
      inviteCode: joi.string().required(),
    },
  }), async (req, res) => {
    try {
      const {
        email, inviteCode,
      } = req.body
      const { participant, token } = await ParticipantsController.verifyInvite({
        email, inviteCode,
      })
      res.respond(
        200,
        {
          participant,
          token,
          message: 'Invite code verified successfully',
        },
      )
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
  .route('/complete-signup')
  .post(auth,
    allow([PARTICIPANT]),
    validate({
      body: {
        name: joi.string().required(),
        password: joi.string().required(),
        supportPersonName: joi.string().allow('').optional(),
        supportPersonEmail: joi.string().allow('').optional(),
      },
    }), async (req, res) => {
      try {
        const {
          name, password, supportPersonName, supportPersonEmail,
        } = req.body
        const { id: participantId, sessionId, primaryPartner } = req.payload
        const participant = await ParticipantsController.completeSignup(participantId, sessionId, primaryPartner, {
          name, password, supportPersonName, supportPersonEmail,
        })
        res.respond(
          200,
          {
            participant,
            message: 'Sign up completed successfully',
          },
        )
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
  .route('/resend-invite')
  .post(
    validate({
      body: {
        email: joi.string().required(),
      },
    }), async (req, res) => {
      try {
        const { email } = req.body

        await ParticipantsController.resendInvite(email)

        res.respond(200, { message: `An email with invite code has been sent again on ${email}` })
      } catch (err) {
        res.respond(err.status || 500, { message: err.message || ERROR_MSG })
      }
    },
  )

router
  .route('/auth/login')
  .post(
    validate({
      body: {
        email: joi.string().required(),
        password: joi.string().required(),
      },
    }), async (req, res) => {
      try {
        const {
          email, password,
        } = req.body
        const { participant, token } = await ParticipantsController.authenticateParticipant({ email, password })
        res.respond(
          200,
          {
            participant,
            token,
            message: 'Login successful.',
          },
        )
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
  .route('/request-reset-password')
  .post(
    validate({
      body: {
        email: joi.string().required(),
      },
    }), async (req, res) => {
      try {
        const {
          email,
        } = req.body
        await ParticipantsController.requestResetPassword(email)
        res.respond(
          200,
          {
            message: `Please check your email ${email}`,
          },
        )
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
  .route('/verify-pin')
  .post(
    validate({
      body: {
        email: joi.string().email().required(),
        code: joi.string().required(),
      },
    }), async (req, res) => {
      try {
        const {
          email,
          code,
        } = req.body
        await ParticipantsController.verifyPasscode({ email, code })
        res.respond(
          200,
          {
            message: 'Code verified',
          },
        )
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
  .route('/reset-password')
  .post(
    validate({
      body: {
        email: joi.string().required(),
        code: joi.string().required(),
        password: joi.string().required(),
      },
    }), async (req, res) => {
      try {
        const {
          email, code, password,
        } = req.body
        await ParticipantsController.resetPassword({ email, code, password })
        res.respond(
          200,
          {
            message: 'Your password has been reset successfully.',
          },
        )
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
  .route('/resources/library')
  .get(
    auth,
    allow([PARTICIPANT]),
    validate({
      query: {
        stageId: joi.objectId().required(),
      },
    }),
    async (req, res) => {
      try {
        const { id: participantId } = req.payload
        const { stageId } = req.query
        const resources = await ParticipantsController.getResourceLibrary(participantId, stageId)
        res.respond(200, { resources })
      } catch (err) {
        res.respond(
          err.status || 500,
          {
            message: err.message || 'An unexpected error has occured',
          },
        )
      }
    },
  )

router
  .route('/resources/search')
  .get(
    auth,
    allow([PARTICIPANT]),
    validate({
      query: {
        searchString: joi.string().optional(),
      },
    }),
    async (req, res) => {
      try {
        const { id: participantId } = req.payload
        const { searchString } = req.query
        const resources = await ParticipantsController.searchResourceLibrary(participantId, searchString || '')
        res.respond(200, { resources })
      } catch (err) {
        res.respond(
          err.status || 500,
          {
            message: err.message || 'An unexpected error has occured',
          },
        )
      }
    },
  )
router
  .route('/my/provider')
  .get(
    auth,
    allow([PARTICIPANT]),
    async (req, res) => {
      try {
        const provider = await ParticipantsController.getLinkedProvider(req.payload.id)
        res.respond(200, { provider })
      } catch (err) {
        res.respond(
          err.status || 500,
          {
            message: err.message || 'An unexpected error has occured',
          },
        )
      }
    },
  )

router
  .route('/my/partners/contact')
  .get(
    auth,
    allow([PARTICIPANT]),
    async (req, res) => {
      try {
        const partners = await ParticipantsController.getPartnersNumbers(req.payload.id)
        res.respond(200, { partners })
      } catch (err) {
        res.respond(
          err.status || 500,
          {
            message: err.message || 'An unexpected error has occured',
          },
        )
      }
    },
  )

// TODO: Remove after testing
router
  .route('/create/participant')
  .post(
    validate({
      body: {
        name: joi.string().required(),
        email: joi.string().required(),
        dateOfSurgery: joi.string().required(),
        stage: joi.objectId().required(),
        group: joi.objectId().required(),
      },
    }), async (req, res) => {
      try {
        const {
          name, email, dateOfSurgery, stage, group,
        } = req.body
        const invitedParticipant = await ParticipantsController.inviteParticipant({
          name, email, dateOfSurgery, group, stage,
        })
        res.respond(
          200,
          {
            participant: invitedParticipant,
            message: 'An invitation to participant has been sent.',
          },
        )
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

module.exports = router
