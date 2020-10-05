const { connectMock } = require('../../db')
const participantsController = require('./participants.controller')
const groupsController = require('../groups/groups.controller')
const providerController = require('../providers/providers.controller')
// const groupAdminsController = require('../group-admins/group-admins.controller')
const Participants = require('./participants.model')
const Groups = require('../groups/groups.model')
const GroupAdmins = require('../group-admins/group-admins.model')

describe('Get participants', () => {
  beforeAll(connectMock)
  require('../stages/stages.model')
  require('../locations/locations.model')
  const groupsToRemove = []
  const groupAdminsToRemove = []
  const participantsToRemove = []
  const mockParticipant = {
    name: 'Muneeb',
    email: 'mriaz+participant@devfactori.com',
    password: '123456',
    phone: '(999)-999-999',
    dateOfSurgery: Date.now(),
    dob: Date.now(),
    status: 'invited',
    address: '123 street local',
  }
  const mockData = {
    admin: { email: 'admin+group@group.test', name: 'Test Group Admin' },
    group: {
      name: 'Axia OB',
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

  afterAll(() => Promise.all([
    Groups.remove({ _id: { $in: groupsToRemove } }).where({}).exec(),
    GroupAdmins.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
    Participants.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
  ]))

  it('Get paginated participants', async () => {
    await groupsController.requestRegistration(mockData.admin, mockData.group)
    const groupAdmin = await GroupAdmins.findOne({ email: mockData.admin.email }).populate('group').exec()
    groupAdminsToRemove.push(groupAdmin)
    const { group } = groupAdmin
    groupsToRemove.push(group)
    expect(groupAdmin).toBeDefined()
    expect(group).toBeDefined()
    mockParticipant.group = group._id
    const savedParticipant = await participantsController.createParticipant(mockParticipant)
    participantsToRemove.push(savedParticipant)
    const {
      participants, page, totalPages, limit, total,
    } = await participantsController.getParticipants({ group: group._id })
    expect(Array.isArray(participants)).toBeTruthy()
    expect(page).toBeDefined()
    expect(totalPages).toBeDefined()
    expect(limit).toBeDefined()
    expect(total).toBeDefined()
  })
})

describe('Edit participant', () => {
  const groupsToRemove = []
  const participantsToRemove = []
  const groupAdminsToRemove = []

  const mockData = {
    admin: { email: 'mriaz+part@devfactori.com', name: 'Muneeb Riaz' },
    group: {
      name: 'Axia Test',
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
  const mockParticipant = {
    name: 'Muneeb',
    email: 'mriaz+partic@devfactori.com',
    password: '123456',
    phone: '(999)-999-999',
    dateOfSurgery: Date.now(),
    dob: Date.now(),
    status: 'invited',
    address: '123 street local',
  }

  beforeAll(connectMock)

  it('Create a participant and edit', async () => {
    await groupsController.requestRegistration(mockData.admin, mockData.group)
    const groupAdmin = await GroupAdmins.findOne({ email: mockData.admin.email }).populate('group').exec()
    groupAdminsToRemove.push(groupAdmin)
    const { group } = groupAdmin
    groupsToRemove.push(group)
    expect(groupAdmin).toBeDefined()
    expect(group).toBeDefined()
    mockParticipant.group = group._id
    const savedParticipant = await participantsController.createParticipant(mockParticipant)
    participantsToRemove.push(savedParticipant)
    const updatedBody = {
      ...mockParticipant, name: 'Updated name', phone: '(888)-888-111', address: 'New address',
    }
    const editedParticipant = await participantsController.updateParticipant(savedParticipant._id, updatedBody)
    expect(editedParticipant).toBeDefined()
    expect(editedParticipant.name).toBe(updatedBody.name)
    expect(editedParticipant.phone).toBe(updatedBody.phone)
    expect(editedParticipant.address).toBe(updatedBody.address)
  })

  afterAll(() => Promise.all([
    Groups.remove({ _id: { $in: groupsToRemove } }).exec(),
    GroupAdmins.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
    Participants.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
  ]))
})

describe('Participant Details', () => {
  const groupsToRemove = []
  const participantsToRemove = []
  const groupAdminsToRemove = []

  const mockData = {
    admin: { email: 'mriaz+upd@devfactori.com', name: 'Muneeb Riaz' },
    group: {
      name: 'Axia Test',
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
  const mockParticipant = {
    name: 'Muneeb',
    email: 'mriaz+updat@devfactori.com',
    password: '123456',
    phone: '(999)-999-999',
    dateOfSurgery: Date.now(),
    dob: Date.now(),
    status: 'invited',
    address: '123 street local',
  }

  beforeAll(connectMock)

  it('Create a participant and get its details', async () => {
    await groupsController.requestRegistration(mockData.admin, mockData.group)
    const groupAdmin = await GroupAdmins.findOne({ email: mockData.admin.email }).populate('group').exec()
    groupAdminsToRemove.push(groupAdmin)
    const { group } = groupAdmin
    groupsToRemove.push(group)
    expect(groupAdmin).toBeDefined()
    expect(group).toBeDefined()
    mockParticipant.group = group._id
    const savedParticipant = await participantsController.createParticipant(mockParticipant)
    participantsToRemove.push(savedParticipant)
    const details = await participantsController.getParticipantDetails(savedParticipant._id)
    expect(details).toBeDefined()
    expect(details.name).toBe(mockParticipant.name)
    expect(details.phone).toBe(mockParticipant.phone)
    expect(details.address).toBe(mockParticipant.address)
  })

  afterAll(() => Promise.all([
    Groups.remove({ _id: { $in: groupsToRemove } }).exec(),
    GroupAdmins.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
    Participants.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
  ]))
})

describe('Suspend participant', () => {
  const groupsToRemove = []
  const participantsToRemove = []
  const groupAdminsToRemove = []

  const mockData = {
    admin: { email: 'mriaz+suspend@devfactori.com', name: 'Muneeb Riaz' },
    group: {
      name: 'Axia Test',
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
  const mockParticipant = {
    name: 'Muneeb',
    email: 'mriaz+suspended@devfactori.com',
    password: '123456',
    phone: '(999)-999-999',
    dateOfSurgery: Date.now(),
    dob: Date.now(),
    status: 'invited',
    address: '123 street local',
  }

  beforeAll(connectMock)

  it('Create a participant and suspend', async () => {
    await groupsController.requestRegistration(mockData.admin, mockData.group)
    const groupAdmin = await GroupAdmins.findOne({ email: mockData.admin.email }).populate('group').exec()
    groupAdminsToRemove.push(groupAdmin)
    const { group } = groupAdmin
    groupsToRemove.push(group)
    expect(groupAdmin).toBeDefined()
    expect(group).toBeDefined()
    mockParticipant.group = group._id
    const savedParticipant = await participantsController.createParticipant(mockParticipant)
    participantsToRemove.push(savedParticipant)
    const details = await participantsController.suspendParticipant(savedParticipant._id, 'suspended')
    expect(details).toBeDefined()
    expect(details.name).toBe(mockParticipant.name)
    expect(details.phone).toBe(mockParticipant.phone)
    expect(details.address).toBe(mockParticipant.address)
    expect(details.status).toBe('suspended')
  })

  afterAll(() => Promise.all([
    Groups.remove({ _id: { $in: groupsToRemove } }).exec(),
    GroupAdmins.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
    Participants.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
  ]))
})

describe('Link provider and participant', () => {
  const groupsToRemove = []
  const participantsToRemove = []
  const groupAdminsToRemove = []

  const mockData = {
    admin: { email: 'mriaz+suspend@devfactori.com', name: 'Muneeb Riaz' },
    group: {
      name: 'Axia Test',
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
  const mockParticipant = {
    name: 'Muneeb',
    email: 'mriaz+linker@devfactori.com',
    password: '123456',
    phone: '(999)-999-999',
    dateOfSurgery: Date.now(),
    dob: Date.now(),
    status: 'invited',
    address: '123 street local',
  }

  beforeAll(connectMock)

  it('Create a participant and link provider', async () => {
    await groupsController.requestRegistration(mockData.admin, mockData.group)
    const groupAdmin = await GroupAdmins.findOne({ email: mockData.admin.email }).populate('group').exec()
    groupAdminsToRemove.push(groupAdmin)
    const { group } = groupAdmin
    groupsToRemove.push(group)
    expect(groupAdmin).toBeDefined()
    expect(group).toBeDefined()
    mockParticipant.group = group._id
    const savedParticipant = await participantsController.createParticipant(mockParticipant)
    const mockProvider = {
      name: 'Muneeb',
      email: 'mriaz+provider009988@devfactori.com',
      phone: '(999)-999-999',
      title: 'Axia provider',
      bio: 'bio',
    }
    const savedProvider = await providerController.createProvider(group._id, mockProvider)
    expect(savedProvider).toBeDefined()
    expect(savedProvider.name).toBe(mockProvider.name)
    expect(savedProvider.phone).toBe(mockProvider.phone)
    participantsToRemove.push(savedParticipant)
    const details = await participantsController.linkProvider(savedParticipant._id, savedProvider._id, group._id)
    expect(details).toBeDefined()
    expect(Array.isArray(details.providers)).toBeTruthy()
    expect(details.providers[0]).toEqual(savedProvider._id)
  })

  afterAll(() => Promise.all([
    Groups.remove({ _id: { $in: groupsToRemove } }).exec(),
    GroupAdmins.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
    Participants.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
  ]))
})

describe('Unlink provider and participant', () => {
  const groupsToRemove = []
  const participantsToRemove = []
  const groupAdminsToRemove = []

  const mockData = {
    admin: { email: 'mriaz+suspend@devfactori.com', name: 'Muneeb Riaz' },
    group: {
      name: 'Axia Test',
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
  const mockParticipant = {
    name: 'Muneeb',
    email: 'mriaz+unlinker@devfactori.com',
    password: '123456',
    phone: '(999)-999-999',
    dateOfSurgery: Date.now(),
    dob: Date.now(),
    status: 'invited',
    address: '123 street local',
  }

  beforeAll(connectMock)

  it('Create a participant and link/unlink provider', async () => {
    await groupsController.requestRegistration(mockData.admin, mockData.group)
    const groupAdmin = await GroupAdmins.findOne({ email: mockData.admin.email }).populate('group').exec()
    groupAdminsToRemove.push(groupAdmin)
    const { group } = groupAdmin
    groupsToRemove.push(group)
    expect(groupAdmin).toBeDefined()
    expect(group).toBeDefined()
    mockParticipant.group = group._id
    const savedParticipant = await participantsController.createParticipant(mockParticipant)
    const mockProvider = {
      name: 'Muneeb',
      email: 'mriaz+unlinkpro@devfactori.com',
      phone: '(999)-999-999',
      title: 'Axia provider',
      bio: 'bio',
    }
    const savedProvider = await providerController.createProvider(group._id, mockProvider)
    expect(savedProvider).toBeDefined()
    expect(savedProvider.name).toBe(mockProvider.name)
    expect(savedProvider.phone).toBe(mockProvider.phone)
    participantsToRemove.push(savedParticipant)
    const details = await participantsController.linkProvider(savedParticipant._id, savedProvider._id, group._id)
    expect(details).toBeDefined()
    expect(Array.isArray(details.providers)).toBeTruthy()
    expect(details.providers[0]).toEqual(savedProvider._id)
    const unlinked = await participantsController.unlinkProvider(savedParticipant._id, savedProvider._id, group.id)
    expect(unlinked).toBeDefined()
    expect(Array.isArray(unlinked.providers)).toBeTruthy()
    expect(unlinked.providers).toEqual([])
  })

  afterAll(() => Promise.all([
    Groups.remove({ _id: { $in: groupsToRemove } }).exec(),
    GroupAdmins.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
    Participants.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
  ]))
})

describe('Fetch linked providers', () => {
  const groupsToRemove = []
  const participantsToRemove = []
  const groupAdminsToRemove = []

  const mockData = {
    admin: { email: 'mriaz+linkeds@devfactori.com', name: 'Muneeb Riaz' },
    group: {
      name: 'Axia Test',
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
  const mockParticipant = {
    name: 'Muneeb',
    email: 'mriaz+linkers@devfactori.com',
    password: '123456',
    phone: '(999)-999-999',
    dateOfSurgery: Date.now(),
    dob: Date.now(),
    status: 'invited',
    address: '123 street local',
  }

  beforeAll(connectMock)

  it('Create a participant and fetch linked provider', async () => {
    await groupsController.requestRegistration(mockData.admin, mockData.group)
    const groupAdmin = await GroupAdmins.findOne({ email: mockData.admin.email }).populate('group').exec()
    groupAdminsToRemove.push(groupAdmin)
    const { group } = groupAdmin
    groupsToRemove.push(group)
    expect(groupAdmin).toBeDefined()
    expect(group).toBeDefined()
    mockParticipant.group = group._id
    const savedParticipant = await participantsController.createParticipant(mockParticipant)
    const mockProvider = {
      name: 'Muneeb',
      email: 'mriaz+provider00988@devfactori.com',
      phone: '(999)-999-999',
      title: 'Axia provider',
      bio: 'bio',
    }
    const savedProvider = await providerController.createProvider(group._id, mockProvider)
    expect(savedProvider).toBeDefined()
    expect(savedProvider.name).toBe(mockProvider.name)
    expect(savedProvider.phone).toBe(mockProvider.phone)
    participantsToRemove.push(savedParticipant)
    const details = await participantsController.linkProvider(savedParticipant._id, savedProvider._id, group._id)
    expect(details).toBeDefined()
    expect(Array.isArray(details.providers)).toBeTruthy()
    expect(details.providers[0]).toEqual(savedProvider._id)
    const providers = await participantsController.getLinkedProviders(savedParticipant._id)
    expect(providers).toBeDefined()
    expect(Array.isArray(providers)).toBeTruthy()
  })

  afterAll(() => Promise.all([
    Groups.remove({ _id: { $in: groupsToRemove } }).exec(),
    GroupAdmins.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
    Participants.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
  ]))
})


describe('Fetch unlinked providers', () => {
  const groupsToRemove = []
  const participantsToRemove = []
  const groupAdminsToRemove = []

  const mockData = {
    admin: { email: 'mriaz+unlinkeds@devfactori.com', name: 'Muneeb Riaz' },
    group: {
      name: 'Axia Test',
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
  const mockParticipant = {
    name: 'Muneeb',
    email: 'mriaz+unlinkers@devfactori.com',
    password: '123456',
    phone: '(999)-999-999',
    dateOfSurgery: Date.now(),
    dob: Date.now(),
    status: 'invited',
    address: '123 street local',
  }

  beforeAll(connectMock)

  it('Create a participant and fetch linked provider', async () => {
    await groupsController.requestRegistration(mockData.admin, mockData.group)
    const groupAdmin = await GroupAdmins.findOne({ email: mockData.admin.email }).populate('group').exec()
    groupAdminsToRemove.push(groupAdmin)
    const { group } = groupAdmin
    groupsToRemove.push(group)
    expect(groupAdmin).toBeDefined()
    expect(group).toBeDefined()
    mockParticipant.group = group._id
    const savedParticipant = await participantsController.createParticipant(mockParticipant)
    const mockProvider = {
      name: 'Muneeb',
      email: 'mriaz+providerunlink@devfactori.com',
      phone: '(999)-999-999',
      title: 'Axia provider',
      bio: 'bio',
    }
    const savedProvider = await providerController.createProvider(group._id, mockProvider)
    expect(savedProvider).toBeDefined()
    expect(savedProvider.name).toBe(mockProvider.name)
    expect(savedProvider.phone).toBe(mockProvider.phone)
    participantsToRemove.push(savedParticipant)
    const details = await participantsController.linkProvider(savedParticipant._id, savedProvider._id, group._id)
    expect(details).toBeDefined()
    expect(Array.isArray(details.providers)).toBeTruthy()
    expect(details.providers[0]).toEqual(savedProvider._id)
    const {
      unlinkedProviders, page, totalPages, limit, total,
    } = await participantsController.getUnlinkedProviders(savedParticipant._id)
    expect(Array.isArray(unlinkedProviders)).toBeTruthy()
    expect(page).toBeDefined()
    expect(totalPages).toBeDefined()
    expect(limit).toBeDefined()
    expect(total).toBeDefined()
  })

  afterAll(() => Promise.all([
    Groups.remove({ _id: { $in: groupsToRemove } }).exec(),
    GroupAdmins.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
    Participants.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
  ]))
})

describe('Participant Details', () => {
  const groupsToRemove = []
  const participantsToRemove = []
  const groupAdminsToRemove = []

  const mockData = {
    admin: { email: 'mriaz+invite@devfactori.com', name: 'Muneeb Riaz' },
    group: {
      name: 'Axia Test',
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
  const mockParticipant = {
    name: 'Muneeb',
    email: 'mriaz+updating@devfactori.com',
    password: '123456',
    phone: '(999)-999-999',
    dateOfSurgery: Date.now(),
    dob: Date.now(),
    address: '123 street local',
  }

  beforeAll(connectMock)

  it('Create a participant and get its details', async () => {
    await groupsController.requestRegistration(mockData.admin, mockData.group)
    const groupAdmin = await GroupAdmins.findOne({ email: mockData.admin.email }).populate('group').exec()
    groupAdminsToRemove.push(groupAdmin)
    const { group } = groupAdmin
    groupsToRemove.push(group)
    expect(groupAdmin).toBeDefined()
    expect(group).toBeDefined()
    mockParticipant.group = group._id
    const savedParticipant = await participantsController.inviteParticipant(mockParticipant)
    participantsToRemove.push(savedParticipant)
    expect(savedParticipant).toBeDefined()
    expect(savedParticipant.status).toBe('invited')
    expect(savedParticipant.name).toBe(mockParticipant.name)
    expect(savedParticipant.phone).toBe(mockParticipant.phone)
    expect(savedParticipant.address).toBe(mockParticipant.address)
  })

  afterAll(() => Promise.all([
    Groups.remove({ _id: { $in: groupsToRemove } }).exec(),
    GroupAdmins.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
    Participants.remove({ _id: { $in: groupAdminsToRemove } }).where({}).exec(),
  ]))
})
