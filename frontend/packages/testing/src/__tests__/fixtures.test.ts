/**
 * Fixtures Tests
 *
 * Tests for test fixtures.
 */

import {
  fixtures,
  createEmptyWorkspaceFixture,
  createActiveWorkspaceFixture,
  createWorkspaceWithDMsFixture,
  authFixtures,
  formFixtures,
  errorFixtures,
} from '../fixtures'

describe('Fixtures', () => {
  it('provides predefined users', () => {
    expect(fixtures.users.alice).toBeDefined()
    expect(fixtures.users.bob).toBeDefined()
    expect(fixtures.users.charlie).toBeDefined()
    expect(fixtures.users.owner).toBeDefined()
    expect(fixtures.users.admin).toBeDefined()
  })

  it('provides predefined channels', () => {
    expect(fixtures.channels.general).toBeDefined()
    expect(fixtures.channels.random).toBeDefined()
    expect(fixtures.channels.general.isDefault).toBe(true)
  })

  it('provides predefined messages', () => {
    expect(fixtures.messages.welcome).toBeDefined()
    expect(fixtures.messages.greeting).toBeDefined()
    expect(fixtures.messages.welcome.type).toBe('system')
  })
})

describe('Workspace Fixtures', () => {
  it('creates an empty workspace', () => {
    const workspace = createEmptyWorkspaceFixture()

    expect(workspace.users).toHaveLength(1)
    expect(workspace.users[0].role).toBe('owner')
    expect(workspace.channels).toHaveLength(1)
    expect(workspace.messages[workspace.channels[0].id]).toHaveLength(1)
  })

  it('creates an active workspace', () => {
    const workspace = createActiveWorkspaceFixture()

    expect(workspace.users.length).toBeGreaterThan(1)
    expect(workspace.channels.length).toBeGreaterThan(1)
    expect(Object.keys(workspace.messages).length).toBeGreaterThan(0)
  })

  it('creates a workspace with DMs', () => {
    const workspace = createWorkspaceWithDMsFixture()

    expect(workspace.users).toHaveLength(3)
    expect(workspace.channels.some((ch) => ch.type === 'direct')).toBe(true)
    expect(Object.keys(workspace.messages).length).toBeGreaterThan(0)
  })
})

describe('Auth Fixtures', () => {
  it('provides valid credentials', () => {
    expect(authFixtures.validCredentials).toHaveProperty('email')
    expect(authFixtures.validCredentials).toHaveProperty('password')
  })

  it('provides invalid credentials', () => {
    expect(authFixtures.invalidCredentials).toHaveProperty('email')
    expect(authFixtures.invalidCredentials).toHaveProperty('password')
  })

  it('provides signup data', () => {
    expect(authFixtures.newUserSignup).toHaveProperty('email')
    expect(authFixtures.newUserSignup).toHaveProperty('password')
    expect(authFixtures.newUserSignup).toHaveProperty('username')
  })
})

describe('Form Fixtures', () => {
  it('provides channel creation data', () => {
    expect(formFixtures.createChannel).toHaveProperty('name')
    expect(formFixtures.createChannel).toHaveProperty('type')
  })

  it('provides profile update data', () => {
    expect(formFixtures.updateProfile).toHaveProperty('displayName')
  })

  it('provides formatted message examples', () => {
    expect(formFixtures.formattedMessage).toHaveProperty('bold')
    expect(formFixtures.formattedMessage).toHaveProperty('code')
  })
})

describe('Error Fixtures', () => {
  it('provides network error', () => {
    expect(errorFixtures.networkError).toBeInstanceOf(Error)
  })

  it('provides HTTP error scenarios', () => {
    expect(errorFixtures.unauthorized.status).toBe(401)
    expect(errorFixtures.forbidden.status).toBe(403)
    expect(errorFixtures.notFound.status).toBe(404)
    expect(errorFixtures.serverError.status).toBe(500)
  })

  it('provides validation error', () => {
    expect(errorFixtures.validationError.status).toBe(400)
    expect(errorFixtures.validationError.errors).toHaveProperty('email')
  })
})
