import { renderHook, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { useChannels, useChannel, useCreateChannel } from '../use-channels'
import { GET_CHANNELS, GET_CHANNEL_BY_SLUG } from '@/graphql/queries/channels'
import { ReactNode } from 'react'

const mockChannelsData = {
  nchat_channels: [
    {
      id: '1',
      name: 'general',
      slug: 'general',
      description: 'General discussion',
      type: 'public',
      topic: null,
      is_default: true,
      created_at: '2024-01-01T00:00:00Z',
      creator: {
        id: 'user1',
        username: 'admin',
        display_name: 'Admin User',
      },
      members_aggregate: {
        aggregate: {
          count: 10,
        },
      },
    },
    {
      id: '2',
      name: 'random',
      slug: 'random',
      description: 'Random chat',
      type: 'public',
      topic: null,
      is_default: false,
      created_at: '2024-01-01T00:00:00Z',
      creator: {
        id: 'user1',
        username: 'admin',
        display_name: 'Admin User',
      },
      members_aggregate: {
        aggregate: {
          count: 8,
        },
      },
    },
  ],
}

const mockChannelDetailData = {
  nchat_channels: [
    {
      id: '1',
      name: 'general',
      slug: 'general',
      description: 'General discussion',
      type: 'public',
      topic: 'Welcome to general',
      is_default: true,
      created_at: '2024-01-01T00:00:00Z',
      creator: {
        id: 'user1',
        username: 'admin',
        display_name: 'Admin User',
        avatar_url: 'https://example.com/avatar.jpg',
      },
      members: [
        {
          user: {
            id: 'user1',
            username: 'admin',
            display_name: 'Admin User',
            avatar_url: 'https://example.com/avatar.jpg',
            status: 'online',
          },
          role: 'admin',
          joined_at: '2024-01-01T00:00:00Z',
        },
      ],
    },
  ],
}

describe('useChannels hook', () => {
  const mocks = [
    {
      request: {
        query: GET_CHANNELS,
      },
      result: {
        data: mockChannelsData,
      },
    },
  ]

  const wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  )

  it('fetches channels successfully', async () => {
    const { result } = renderHook(() => useChannels(), { wrapper })

    expect(result.current.loading).toBe(true)
    expect(result.current.channels).toEqual([])

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.channels).toEqual(mockChannelsData.nchat_channels)
    expect(result.current.error).toBeUndefined()
  })

  it('handles empty channels list', async () => {
    const emptyMocks = [
      {
        request: {
          query: GET_CHANNELS,
        },
        result: {
          data: { nchat_channels: [] },
        },
      },
    ]

    const emptyWrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={emptyMocks} addTypename={false}>
        {children}
      </MockedProvider>
    )

    const { result } = renderHook(() => useChannels(), { wrapper: emptyWrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.channels).toEqual([])
  })

  it('handles query error', async () => {
    const errorMocks = [
      {
        request: {
          query: GET_CHANNELS,
        },
        error: new Error('Failed to fetch channels'),
      },
    ]

    const errorWrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={errorMocks} addTypename={false}>
        {children}
      </MockedProvider>
    )

    const { result } = renderHook(() => useChannels(), { wrapper: errorWrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeDefined()
    expect(result.current.channels).toEqual([])
  })
})

describe('useChannel hook', () => {
  const mocks = [
    {
      request: {
        query: GET_CHANNEL_BY_SLUG,
        variables: { slug: 'general' },
      },
      result: {
        data: mockChannelDetailData,
      },
    },
  ]

  const wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  )

  it('fetches channel by slug', async () => {
    const { result } = renderHook(() => useChannel('general'), { wrapper })

    expect(result.current.loading).toBe(true)
    expect(result.current.channel).toBeNull()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.channel).toEqual(mockChannelDetailData.nchat_channels[0])
    expect(result.current.error).toBeUndefined()
  })

  it('skips query when slug is empty', () => {
    const { result } = renderHook(() => useChannel(''), { wrapper })

    expect(result.current.loading).toBe(false)
    expect(result.current.channel).toBeNull()
  })

  it('handles non-existent channel', async () => {
    const notFoundMocks = [
      {
        request: {
          query: GET_CHANNEL_BY_SLUG,
          variables: { slug: 'non-existent' },
        },
        result: {
          data: { nchat_channels: [] },
        },
      },
    ]

    const notFoundWrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={notFoundMocks} addTypename={false}>
        {children}
      </MockedProvider>
    )

    const { result } = renderHook(() => useChannel('non-existent'), { 
      wrapper: notFoundWrapper 
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.channel).toBeNull()
  })
})

describe('useCreateChannel hook', () => {
  const createChannelMock = {
    request: {
      query: expect.anything(), // We'll match the mutation
      variables: {
        name: 'new-channel',
        slug: 'new-channel',
        description: 'A new channel',
        type: 'public',
        creatorId: 'user1',
      },
    },
    result: {
      data: {
        insert_nchat_channels_one: {
          id: '3',
          name: 'new-channel',
          slug: 'new-channel',
        },
      },
    },
  }

  const wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={[createChannelMock]} addTypename={false}>
      {children}
    </MockedProvider>
  )

  it('provides createChannel function', () => {
    const { result } = renderHook(() => useCreateChannel(), { wrapper })

    expect(result.current.createChannel).toBeDefined()
    expect(typeof result.current.createChannel).toBe('function')
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })
})