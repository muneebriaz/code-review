const request = require('supertest')
const app = require('../../app')
const { connectMock } = require('../../db')
const GroupAdmins = require('../group-admins/group-admins.model')
const Groups = require('../groups/groups.model')
const { createAdmin } = require('../admins/admins.controller')
const Token = require('../../services/token.service')


describe('Participants listing', () => {
  const groupsToRemove = []
  const groupAdminsToRemove = []
  beforeAll(connectMock)
  afterAll(() => Promise.all([
    Groups.remove({ _id: { $in: groupsToRemove } }).where({}).exec(),
    GroupAdmins.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
  ]))
  const requestBody = {
    admin: { email: 'mriaz+aiy@devfactori.com', name: 'Test Group Admin' },
    group: {
      name: 'Axia Women Health',
      address: {
        streetAddress: 'ABC Street',
        unitNumber: '123',
        city: 'Long Island',
        state: 'NY',
        zip: 'NY1212',
      },
      phone: '(999)-999-999',

      estimatedVolume: '1-50',
    },
  }

  it('Creates a group and fetches participants', async () => {
    const adminBody = { email: 'umairn+super@devfactori.com', password: '123456' }
    const createdAdmin = await createAdmin(adminBody)
    const adminToken = await Token.generateToken({ id: createdAdmin._id, role: 'admin' })
    const response = await request(app)
      .post('/groups')
      .send(requestBody)
      .set({ Authorization: `Bearer ${adminToken}` })
    expect(response.status).toBe(200)
    expect(response.body.message).toBeDefined()
    expect(response.body.group).toBeDefined()
    const { body: { group: { _id: groupId, admins: [{ _id: adminId }] } } } = response
    const token = await Token.generateToken({ id: adminId, groupId, role: 'groupAdmin' })
    const {
      status,
      body: {
        participants, total, page, totalPages, limit,
      },
    } = await request(app)
      .get('/participants')
      .set({ Authorization: `Bearer ${token}` })
      .query({ limit: 10, page: 1 })
    expect(status).toBe(200)
    expect(Array.isArray(participants)).toBeTruthy()
    expect(limit).toBe(10)
    expect(total).toBeDefined()
    expect(page).toBe(1)
    expect(totalPages).toBeDefined()
  })
})

describe('Update participant', () => {
  const groupsToRemove = []
  const groupAdminsToRemove = []
  beforeAll(connectMock)
  afterAll(() => Promise.all([
    Groups.remove({ _id: { $in: groupsToRemove } }).where({}).exec(),
    GroupAdmins.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
  ]))
  const requestBody = {
    admin: { email: 'mriaz+term@devfactori.com', name: 'Test Group Admin' },
    group: {
      name: 'Axia Women Health',
      address: {
        streetAddress: 'ABC Street',
        unitNumber: '123',
        city: 'Long Island',
        state: 'NY',
        zip: 'NY1212',
      },
      phone: '(999)-999-999',

      estimatedVolume: '1-50',
    },
  }

  it('Creates a group and edit participant', async () => {
    const adminBody = { email: 'umairn+super@devfactori.com', password: '123456' }
    const createdAdmin = await createAdmin(adminBody)
    const adminToken = await Token.generateToken({ id: createdAdmin._id, role: 'admin' })
    const response = await request(app)
      .post('/groups')
      .send(requestBody)
      .set({ authorization: `Bearer ${adminToken}` })
    expect(response.status).toBe(200)
    expect(response.body.message).toBeDefined()
    expect(response.body.group).toBeDefined()
    const { body: { group: { _id: groupId, admins: [{ _id: adminId }] } } } = response
    const token = await Token.generateToken({ id: adminId, groupId, role: 'groupAdmin' })
    const mockParticipant = {
      name: 'Muneeb',
      email: 'mriaz+participa@devfactori.com',
      password: '123456',
      phone: '(999)-999-999',
      dateOfSurgery: Date.now(),
      dob: Date.now(),
      status: 'invited',
      address: '123 street local',
      group: groupId,
    }
    const { body: { participant: participantsResponse } } = await request(app)
      .post('/participants')
      .set({ Authorization: `Bearer ${token}` })
      .send(mockParticipant)
    const editBody = { ...participantsResponse, name: 'Abubakar', address: '132 street global' }
    const {
      status,
      body: {
        participant,
      },
    } = await request(app)
      .patch(`/participants/${participantsResponse._id.toString()}`)
      .set({ Authorization: `Bearer ${token}` })
      .send(editBody)
    expect(status).toBe(200)
    expect(participant).toBeDefined()
    expect(participant.name).toBe(editBody.name)
    expect(participant.address).toBe(editBody.address)
  })
})

describe('Get participant details', () => {
  const groupsToRemove = []
  const groupAdminsToRemove = []
  beforeAll(connectMock)
  afterAll(() => Promise.all([
    Groups.remove({ _id: { $in: groupsToRemove } }).where({}).exec(),
    GroupAdmins.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
  ]))
  const requestBody = {
    admin: { email: 'mriaz+det@devfactori.com', name: 'Test Group Admin' },
    group: {
      name: 'Axia Women Health',
      address: {
        streetAddress: 'ABC Street',
        unitNumber: '123',
        city: 'Long Island',
        state: 'NY',
        zip: 'NY1212',
      },
      phone: '(999)-999-999',

      estimatedVolume: '1-50',
    },
  }

  it('Creates a participant and get details of participant', async () => {
    const adminBody = { email: 'umairn+super@devfactori.com', password: '123456' }
    const createdAdmin = await createAdmin(adminBody)
    const adminToken = await Token.generateToken({ id: createdAdmin._id, role: 'admin' })
    const response = await request(app)
      .post('/groups')
      .send(requestBody)
      .set({ authorization: `Bearer ${adminToken}` })
    expect(response.status).toBe(200)
    expect(response.body.message).toBeDefined()
    expect(response.body.group).toBeDefined()
    const { body: { group: { _id: groupId, admins: [{ _id: adminId }] } } } = response
    const token = await Token.generateToken({ id: adminId, groupId, role: 'groupAdmin' })
    const mockParticipant = {
      name: 'Muneeb',
      email: 'mriaz+partidet@devfactori.com',
      password: '123456',
      phone: '(999)-999-999',
      dateOfSurgery: Date.now(),
      dob: Date.now(),
      status: 'invited',
      address: '123 street local',
      group: groupId,
    }
    const { body: { participant: participantsResponse } } = await request(app)
      .post('/participants')
      .set({ Authorization: `Bearer ${token}` })
      .send(mockParticipant)
    const {
      status,
      body: {
        participant,
      },
    } = await request(app)
      .get(`/participants/${participantsResponse._id.toString()}`)
      .set({ Authorization: `Bearer ${token}` })
    expect(status).toBe(200)
    expect(participant).toBeDefined()
    expect(participant.name).toBe(mockParticipant.name)
    expect(participant.address).toBe(mockParticipant.address)
  })
})

describe('Suspend participant', () => {
  const groupsToRemove = []
  const groupAdminsToRemove = []
  beforeAll(connectMock)
  afterAll(() => Promise.all([
    Groups.remove({ _id: { $in: groupsToRemove } }).where({}).exec(),
    GroupAdmins.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
  ]))
  const requestBody = {
    admin: { email: 'mriaz+dum79@devfactori.com', name: 'Test Group Admin' },
    group: {
      name: 'Axia Women Health',
      address: {
        streetAddress: 'ABC Street',
        unitNumber: '123',
        city: 'Long Island',
        state: 'NY',
        zip: 'NY1212',
      },
      phone: '(999)-999-999',

      estimatedVolume: '1-50',
    },
  }

  it('Creates a participant and suspend participant', async () => {
    const adminBody = { email: 'umairn+super@devfactori.com', password: '123456' }
    const createdAdmin = await createAdmin(adminBody)
    const adminToken = await Token.generateToken({ id: createdAdmin._id, role: 'admin' })
    const response = await request(app)
      .post('/groups')
      .send(requestBody)
      .set({ authorization: `Bearer ${adminToken}` })
    expect(response.status).toBe(200)
    expect(response.body.message).toBeDefined()
    expect(response.body.group).toBeDefined()
    const { body: { group: { _id: groupId, admins: [{ _id: adminId }] } } } = response
    const token = await Token.generateToken({ id: adminId, groupId, role: 'groupAdmin' })
    const mockParticipant = {
      name: 'Muneeb',
      email: 'mriaz+dum80@devfactori.com',
      password: '123456',
      phone: '(999)-999-999',
      dateOfSurgery: Date.now(),
      dob: Date.now(),
      status: 'invited',
      address: '123 street local',
      group: groupId,
    }
    const { body: { participant: participantsResponse } } = await request(app)
      .post('/participants')
      .set({ Authorization: `Bearer ${token}` })
      .send(mockParticipant)
    const {
      status,
      body: {
        participant,
      },
    } = await request(app)
      .delete(`/participants/${participantsResponse._id.toString()}`)
      .set({ Authorization: `Bearer ${token}` })
      .query({ status: 'suspended' })
      .send()
    expect(status).toBe(200)
    expect(participant).toBeDefined()
    expect(participant.status).toBe('suspended')
  })
})

describe('Link participant & provider', () => {
  const groupsToRemove = []
  const groupAdminsToRemove = []
  beforeAll(connectMock)
  afterAll(() => Promise.all([
    Groups.remove({ _id: { $in: groupsToRemove } }).where({}).exec(),
    GroupAdmins.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
  ]))
  const requestBody = {
    admin: { email: 'mriaz+link79@devfactori.com', name: 'Test Group Admin' },
    group: {
      name: 'Axia Women Health',
      address: {
        streetAddress: 'ABC Street',
        unitNumber: '123',
        city: 'Long Island',
        state: 'NY',
        zip: 'NY1212',
      },
      phone: '(999)-999-999',

      estimatedVolume: '1-50',
    },
  }

  it('Creates a participant and link participant', async () => {
    const adminBody = { email: 'umairn+super@devfactori.com', password: '123456' }
    const createdAdmin = await createAdmin(adminBody)
    const adminToken = await Token.generateToken({ id: createdAdmin._id, role: 'admin' })
    const response = await request(app)
      .post('/groups')
      .send(requestBody)
      .set({ authorization: `Bearer ${adminToken}` })
    expect(response.status).toBe(200)
    expect(response.body.message).toBeDefined()
    expect(response.body.group).toBeDefined()
    const { body: { group: { _id: groupId, admins: [{ _id: adminId }] } } } = response
    const token = await Token.generateToken({ id: adminId, groupId, role: 'groupAdmin' })
    const mockParticipant = {
      name: 'Muneeb',
      email: 'mriaz+participant80@devfactori.com',
      password: '123456',
      phone: '(999)-999-999',
      dateOfSurgery: Date.now(),
      dob: Date.now(),
      status: 'invited',
      address: '123 street local',
      group: groupId,
    }
    const { body: { participant: participantsResponse } } = await request(app)
      .post('/participants')
      .set({ Authorization: `Bearer ${token}` })
      .send(mockParticipant)
    const mockProvider = {
      name: 'Muneeb',
      email: 'mriaz+unlinkpro@devfactori.com',
      phone: '(999)-999-999',
      title: 'Axia provider',
      bio: 'bio',
    }
    const {
      status,
      body: {
        provider,
      },
    } = await request(app)
      .post('/providers')
      .set({ Authorization: `Bearer ${token}` })
      .send(mockProvider)
    expect(status).toBe(200)
    expect(provider).toBeDefined()
    const {
      status: linkStatus,
      body: {
        participant: linkedParticipant,
      },
    } = await request(app)
      .post(`/participants/${participantsResponse._id.toString()}/linkProvider`)
      .set({ Authorization: `Bearer ${token}` })
      .send({ provider: provider._id.toString() })
    expect(linkStatus).toBe(200)
    expect(linkedParticipant).toBeDefined()
  })
})


describe('Unlink participant & provider', () => {
  const groupsToRemove = []
  const groupAdminsToRemove = []
  beforeAll(connectMock)
  afterAll(() => Promise.all([
    Groups.remove({ _id: { $in: groupsToRemove } }).where({}).exec(),
    GroupAdmins.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
  ]))
  const requestBody = {
    admin: { email: 'mriaz+linq9@devfactori.com', name: 'Test Group Admin' },
    group: {
      name: 'Axia Women Health',
      address: {
        streetAddress: 'ABC Street',
        unitNumber: '123',
        city: 'Long Island',
        state: 'NY',
        zip: 'NY1212',
      },
      phone: '(999)-999-999',

      estimatedVolume: '1-50',
    },
  }

  it('Creates a participant and link/unlink participant', async () => {
    const adminBody = { email: 'umairn+super@devfactori.com', password: '123456' }
    const createdAdmin = await createAdmin(adminBody)
    const adminToken = await Token.generateToken({ id: createdAdmin._id, role: 'admin' })
    const response = await request(app)
      .post('/groups')
      .send(requestBody)
      .set({ authorization: `Bearer ${adminToken}` })
    expect(response.status).toBe(200)
    expect(response.body.message).toBeDefined()
    expect(response.body.group).toBeDefined()
    const { body: { group: { _id: groupId, admins: [{ _id: adminId }] } } } = response
    const token = await Token.generateToken({ id: adminId, groupId, role: 'groupAdmin' })
    const mockParticipant = {
      name: 'Muneeb',
      email: 'mriaz+participant81@devfactori.com',
      password: '123456',
      phone: '(999)-999-999',
      dateOfSurgery: Date.now(),
      dob: Date.now(),
      status: 'invited',
      address: '123 street local',
      group: groupId,
    }
    const { body: { participant: participantsResponse } } = await request(app)
      .post('/participants')
      .set({ Authorization: `Bearer ${token}` })
      .send(mockParticipant)
    const mockProvider = {
      name: 'Muneeb',
      email: 'mriaz+unlinkpro31@devfactori.com',
      phone: '(999)-999-999',
      title: 'Axia provider',
      bio: 'bio',
    }
    const {
      status,
      body: {
        provider,
      },
    } = await request(app)
      .post('/providers')
      .set({ Authorization: `Bearer ${token}` })
      .send(mockProvider)
    expect(status).toBe(200)
    expect(provider).toBeDefined()
    const {
      status: linkStatus,
      body: {
        participant: linkedParticipant,
      },
    } = await request(app)
      .post(`/participants/${participantsResponse._id.toString()}/linkProvider`)
      .set({ Authorization: `Bearer ${token}` })
      .send({ provider: provider._id.toString() })
    expect(linkStatus).toBe(200)
    expect(linkedParticipant).toBeDefined()
    const {
      status: unlinkStatus,
      body: {
        participant: unlinkedParticipant,
      },
    } = await request(app)
      .post(`/participants/${participantsResponse._id.toString()}/unlinkProvider`)
      .set({ Authorization: `Bearer ${token}` })
      .send({ provider: provider._id.toString() })
    expect(unlinkStatus).toBe(200)
    expect(unlinkedParticipant).toBeDefined()
  })
})
