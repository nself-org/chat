import { gql } from '@apollo/client'

// Query to get app configuration
export const GET_APP_CONFIG = gql`
  query GetAppConfiguration {
    app_configuration {
      key
      value
      category
    }
  }
`

// Mutation to update app configuration
export const UPDATE_APP_CONFIG = gql`
  mutation UpdateAppConfiguration($objects: [app_configuration_insert_input!]!) {
    insert_app_configuration(
      objects: $objects
      on_conflict: {
        constraint: app_configuration_key_key
        update_columns: [value, updated_at]
      }
    ) {
      affected_rows
      returning {
        key
        value
      }
    }
  }
`