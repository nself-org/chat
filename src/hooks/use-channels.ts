import { useQuery, useMutation } from '@apollo/client'
import { GET_CHANNELS, GET_CHANNEL_BY_SLUG } from '@/graphql/queries/channels'
import { gql } from '@apollo/client'

export function useChannels() {
  const { data, loading, error, refetch } = useQuery(GET_CHANNELS)
  
  return {
    channels: data?.nchat_channels || [],
    loading,
    error,
    refetch,
  }
}

export function useChannel(slug: string) {
  const { data, loading, error } = useQuery(GET_CHANNEL_BY_SLUG, {
    variables: { slug },
    skip: !slug,
  })
  
  return {
    channel: data?.nchat_channels?.[0] || null,
    loading,
    error,
  }
}

const CREATE_CHANNEL = gql`
  mutation CreateChannel(
    $name: String!
    $slug: String!
    $description: String
    $type: String!
    $creatorId: uuid!
  ) {
    insert_nchat_channels_one(
      object: {
        name: $name
        slug: $slug
        description: $description
        type: $type
        creator_id: $creatorId
      }
    ) {
      id
      name
      slug
    }
  }
`

export function useCreateChannel() {
  const [createChannel, { loading, error }] = useMutation(CREATE_CHANNEL, {
    refetchQueries: [{ query: GET_CHANNELS }],
  })
  
  return {
    createChannel,
    loading,
    error,
  }
}