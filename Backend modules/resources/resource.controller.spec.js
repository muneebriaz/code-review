const { connectMock } = require('../../db')
const {
  createResource, getResources, getResourceById, updateResource,
  updateResourceStatus,
} = require('./resource.controller')
const { createResourceCategory } = require('../resource-categories/resource-categories.controller')
const { STATUS: { RESOURCE: { REMOVED } } } = require('../../constants')

const mockResourceCategory = { name: 'first-category', applicable: 'primary' }
const mockResource = {
  headline: 'Sleeping',
  type: 'article',
  media: 'This is media',
  description: 'This is description',
  viewTime: 1,
}
describe('Resource model test', () => {
  beforeAll(connectMock)
  require('../locations/locations.model')

  it('Resource Category', async () => {
    const savedResourceCategory = await createResourceCategory(mockResourceCategory)
    mockResource.category = savedResourceCategory._id
    const savedResource = await createResource(mockResource)
    expect(savedResource.headline).toBe(mockResource.headline)
    expect(savedResource.type).toBe(mockResource.type)
    expect(savedResource.media).toBe(mockResource.media)
    expect(savedResource.description).toBe(mockResource.description)
    expect(savedResource.viewTime).toBe(mockResource.viewTime)
  })
})

describe('Resource paginated list', () => {
  beforeAll(connectMock)
  const resourceCategory = { name: 'firsts-category', applicable: 'primary' }
  const resource = {
    headline: 'Walking',
    type: 'article',
    media: 'This is media',
    description: 'This is description',
    viewTime: 1,
  }
  it('Returns list of resources', async () => {
    const savedResourceCategory = await createResourceCategory(resourceCategory)
    resource.category = savedResourceCategory._id
    await createResource(resource)
    const {
      resources, page, totalPages, limit, total,
    } = await getResources(savedResourceCategory._id)
    expect(Array.isArray(resources)).toBeTruthy()
    expect(page).toBeDefined()
    expect(totalPages).toBeDefined()
    expect(limit).toBeDefined()
    expect(total).toBeDefined()
  })
})

describe('Resource model test', () => {
  beforeAll(connectMock)
  const resourceCategory = { name: 'second-category', applicable: 'primary' }
  const resource = {
    headline: 'Eating',
    type: 'article',
    media: 'This is media',
    description: 'This is description',
    viewTime: 1,
  }
  it('Resource Category', async () => {
    const savedResourceCategory = await createResourceCategory(resourceCategory)
    resource.category = savedResourceCategory._id
    const savedResource = await createResource(resource)
    expect(savedResource.headline).toBe(resource.headline)
    expect(savedResource.type).toBe(resource.type)
    expect(savedResource.media).toBe(resource.media)
    expect(savedResource.description).toBe(resource.description)
    expect(savedResource.viewTime).toBe(resource.viewTime)
    const fetchedResource = await getResourceById(savedResource._id)
    expect(fetchedResource.headline).toBe(resource.headline)
    expect(fetchedResource.type).toBe(resource.type)
    expect(fetchedResource.media).toBe(resource.media)
    expect(fetchedResource.description).toBe(resource.description)
    expect(fetchedResource.viewTime).toBe(resource.viewTime)
  })
})

describe('Resource model test', () => {
  beforeAll(connectMock)
  const resourceCategory = { name: 'fourth-category', applicable: 'primary' }
  const resource = {
    headline: 'Running',
    type: 'article',
    media: 'This is media',
    description: 'This is description',
    viewTime: 1,
  }
  it('Resource Category', async () => {
    const savedResourceCategory = await createResourceCategory(resourceCategory)
    resource.category = savedResourceCategory._id
    const savedResource = await createResource(resource)
    expect(savedResource.headline).toBe(resource.headline)
    expect(savedResource.type).toBe(resource.type)
    expect(savedResource.media).toBe(resource.media)
    expect(savedResource.description).toBe(resource.description)
    expect(savedResource.viewTime).toBe(resource.viewTime)
    const updateBody = { headline: 'New Headline', ...resource }
    const updatedResource = await updateResource(savedResource._id, updateBody)
    expect(updatedResource.headline).toBe(updateBody.headline)
    expect(updatedResource.type).toBe(updateBody.type)
    expect(updatedResource.media).toBe(updateBody.media)
    expect(updatedResource.description).toBe(updateBody.description)
    expect(updatedResource.viewTime).toBe(updateBody.viewTime)
  })
})

describe('Resource status update', () => {
  beforeAll(connectMock)
  const resourceCategory = { name: 'Status category', applicable: 'primary' }
  const resource = {
    headline: 'Jumping',
    type: 'article',
    media: 'This is media',
    description: 'This is description',
    viewTime: 1,
  }
  it('Resource Category', async () => {
    const savedResourceCategory = await createResourceCategory(resourceCategory)
    resource.category = savedResourceCategory._id
    const savedResource = await createResource(resource)
    expect(savedResource.headline).toBe(resource.headline)
    expect(savedResource.type).toBe(resource.type)
    expect(savedResource.media).toBe(resource.media)
    expect(savedResource.description).toBe(resource.description)
    expect(savedResource.viewTime).toBe(resource.viewTime)
    const updatedResource = await updateResourceStatus(savedResource._id, 'admin')
    expect(updatedResource.status).toBe(REMOVED)
  })
})
