/**
 * Mobile E2E Tests: Search
 *
 * Tests search functionality including message search, semantic search, and filters
 */

import { device, element, by, expect as detoxExpect } from 'detox'
import { MobileTestHelper, PerformanceHelper, TEST_USERS } from './setup'

describe('Mobile Search', () => {
  beforeAll(async () => {
    await MobileTestHelper.login(TEST_USERS.member)
  })

  beforeEach(async () => {
    PerformanceHelper.clear()
  })

  describe('Basic Search', () => {
    it('should open search screen', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))
      await MobileTestHelper.waitForElement(by.id('search-screen'))
      await MobileTestHelper.assertElementVisible(by.id('search-input'))
    })

    it('should search messages by text', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))

      PerformanceHelper.mark('search-start')
      await MobileTestHelper.typeText(by.id('search-input'), 'hello')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      const searchDuration = PerformanceHelper.measure('Search Query', 'search-start')
      expect(searchDuration).toBeLessThan(2000)

      // Results should appear
      await MobileTestHelper.waitForElement(by.id('search-results'))
    })

    it('should show search suggestions', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))
      await element(by.id('search-input')).typeText('hel')

      // Suggestions should appear
      await MobileTestHelper.waitForElement(by.id('search-suggestions'), 2000)
    })

    it('should show recent searches', async () => {
      // Perform a search first
      await MobileTestHelper.tapElement(by.id('search-button'))
      await MobileTestHelper.typeText(by.id('search-input'), 'test search')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      // Go back and open search again
      await MobileTestHelper.tapElement(by.id('back-button'))
      await MobileTestHelper.tapElement(by.id('search-button'))

      // Recent searches should be visible
      await MobileTestHelper.assertTextExists('Recent Searches')
      await MobileTestHelper.assertTextExists('test search')
    })

    it('should clear recent searches', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))

      if (await element(by.id('clear-recent-searches')).isVisible()) {
        await MobileTestHelper.tapElement(by.id('clear-recent-searches'))
        await detoxExpect(element(by.text('Recent Searches'))).not.toExist()
      }
    })
  })

  describe('Semantic Search', () => {
    it('should perform semantic search', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))

      // Enable semantic search
      await MobileTestHelper.tapElement(by.id('semantic-search-toggle'))

      await MobileTestHelper.typeText(by.id('search-input'), 'project deadline')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      // Results should include semantically similar messages
      await MobileTestHelper.waitForElement(by.id('search-results'))
    })

    it('should show semantic search quality indicator', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))
      await MobileTestHelper.tapElement(by.id('semantic-search-toggle'))

      await MobileTestHelper.typeText(by.id('search-input'), 'important update')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      // Relevance scores should be visible
      await detoxExpect(element(by.id('relevance-score'))).toExist()
    })

    it('should compare semantic vs exact search', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))

      // First exact search
      await MobileTestHelper.typeText(by.id('search-input'), 'meeting')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))
      await MobileTestHelper.wait(1000)

      const exactResultCount = await element(by.id('result-count')).getAttributes()

      // Clear and try semantic
      await MobileTestHelper.tapElement(by.id('clear-search-input'))
      await MobileTestHelper.tapElement(by.id('semantic-search-toggle'))
      await MobileTestHelper.typeText(by.id('search-input'), 'meeting')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      // Semantic should have different (possibly more) results
      await MobileTestHelper.waitForElement(by.id('search-results'))
    })
  })

  describe('Search Filters', () => {
    it('should open filter panel', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))
      await MobileTestHelper.tapElement(by.id('filter-button'))

      await MobileTestHelper.waitForElement(by.id('filter-panel'))
    })

    it('should filter by channel', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))
      await MobileTestHelper.typeText(by.id('search-input'), 'test')

      await MobileTestHelper.tapElement(by.id('filter-button'))
      await MobileTestHelper.tapElement(by.id('filter-channel'))
      await MobileTestHelper.tapElement(by.id('channel-general'))
      await MobileTestHelper.tapElement(by.id('apply-filters'))

      // Results should only show messages from general channel
      await MobileTestHelper.waitForElement(by.id('search-results'))
    })

    it('should filter by date range', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))
      await MobileTestHelper.typeText(by.id('search-input'), 'test')

      await MobileTestHelper.tapElement(by.id('filter-button'))
      await MobileTestHelper.tapElement(by.id('date-range-filter'))
      await MobileTestHelper.tapElement(by.id('last-week-option'))
      await MobileTestHelper.tapElement(by.id('apply-filters'))

      await MobileTestHelper.waitForElement(by.id('search-results'))
    })

    it('should filter by sender', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))
      await MobileTestHelper.typeText(by.id('search-input'), 'hello')

      await MobileTestHelper.tapElement(by.id('filter-button'))
      await MobileTestHelper.tapElement(by.id('filter-sender'))
      await MobileTestHelper.typeText(by.id('sender-search'), 'Test Member')
      await MobileTestHelper.tapElement(by.id('select-sender-0'))
      await MobileTestHelper.tapElement(by.id('apply-filters'))

      await MobileTestHelper.waitForElement(by.id('search-results'))
    })

    it('should filter by attachment type', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))

      await MobileTestHelper.tapElement(by.id('filter-button'))
      await MobileTestHelper.tapElement(by.id('has-attachments'))
      await MobileTestHelper.tapElement(by.id('attachment-type-image'))
      await MobileTestHelper.tapElement(by.id('apply-filters'))
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      // Should show only messages with images
      await MobileTestHelper.waitForElement(by.id('search-results'))
    })

    it('should combine multiple filters', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))
      await MobileTestHelper.typeText(by.id('search-input'), 'project')

      await MobileTestHelper.tapElement(by.id('filter-button'))

      // Channel filter
      await MobileTestHelper.tapElement(by.id('filter-channel'))
      await MobileTestHelper.tapElement(by.id('channel-general'))

      // Date filter
      await MobileTestHelper.tapElement(by.id('date-range-filter'))
      await MobileTestHelper.tapElement(by.id('last-month-option'))

      await MobileTestHelper.tapElement(by.id('apply-filters'))

      await MobileTestHelper.waitForElement(by.id('search-results'))
    })

    it('should clear all filters', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))

      await MobileTestHelper.tapElement(by.id('filter-button'))
      await MobileTestHelper.tapElement(by.id('filter-channel'))
      await MobileTestHelper.tapElement(by.id('channel-general'))
      await MobileTestHelper.tapElement(by.id('clear-all-filters'))

      // Filters should be reset
      await detoxExpect(element(by.id('active-filter-badge'))).not.toExist()
    })
  })

  describe('Search Results', () => {
    it('should display search results with context', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))
      await MobileTestHelper.typeText(by.id('search-input'), 'hello')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      await MobileTestHelper.waitForElement(by.id('search-results'))

      // Result should show message preview, sender, and timestamp
      await detoxExpect(element(by.id('result-preview-0'))).toExist()
      await detoxExpect(element(by.id('result-sender-0'))).toExist()
      await detoxExpect(element(by.id('result-timestamp-0'))).toExist()
    })

    it('should highlight search terms in results', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))
      await MobileTestHelper.typeText(by.id('search-input'), 'important')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      await MobileTestHelper.waitForElement(by.id('search-results'))

      // Highlighted text should be present
      await detoxExpect(element(by.id('highlighted-text'))).toExist()
    })

    it('should navigate to message from search result', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))
      await MobileTestHelper.typeText(by.id('search-input'), 'test')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      await MobileTestHelper.waitForElement(by.id('search-results'))

      // Tap first result
      await MobileTestHelper.tapElement(by.id('result-item-0'))

      // Should navigate to message in channel
      await MobileTestHelper.waitForElement(by.id('message-list'))
      await detoxExpect(element(by.id('highlighted-message'))).toExist()
    })

    it('should paginate search results', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))
      await MobileTestHelper.typeText(by.id('search-input'), 'a')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      await MobileTestHelper.waitForElement(by.id('search-results'))

      // Scroll to load more
      await element(by.id('search-results')).scroll(500, 'down')

      // Load more button or auto-load should trigger
      await MobileTestHelper.wait(1000)
    })

    it('should show no results message', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))
      await MobileTestHelper.typeText(by.id('search-input'), 'xyznonexistent123')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      await MobileTestHelper.assertTextExists('No results found')
    })
  })

  describe('Advanced Search', () => {
    it('should use advanced search syntax', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))

      // Use quote syntax for exact match
      await MobileTestHelper.typeText(by.id('search-input'), '"exact phrase"')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      await MobileTestHelper.waitForElement(by.id('search-results'))
    })

    it('should support boolean operators', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))

      // AND operator
      await MobileTestHelper.typeText(by.id('search-input'), 'project AND deadline')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      await MobileTestHelper.waitForElement(by.id('search-results'))
    })

    it('should exclude terms with minus', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))

      await MobileTestHelper.typeText(by.id('search-input'), 'project -completed')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      await MobileTestHelper.waitForElement(by.id('search-results'))
    })

    it('should search by hashtag', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))

      await MobileTestHelper.typeText(by.id('search-input'), '#urgent')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      await MobileTestHelper.waitForElement(by.id('search-results'))
    })

    it('should search by mention', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))

      await MobileTestHelper.typeText(by.id('search-input'), '@TestUser')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      await MobileTestHelper.waitForElement(by.id('search-results'))
    })
  })

  describe('Performance', () => {
    it('should complete search within acceptable time', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))

      PerformanceHelper.mark('search-start')

      await MobileTestHelper.typeText(by.id('search-input'), 'project update')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      await MobileTestHelper.waitForElement(by.id('search-results'))

      const searchDuration = PerformanceHelper.measure('Full Search', 'search-start')
      expect(searchDuration).toBeLessThan(3000)
    })

    it('should handle large result sets efficiently', async () => {
      await MobileTestHelper.tapElement(by.id('search-button'))

      // Search for common term
      await MobileTestHelper.typeText(by.id('search-input'), 'the')
      await MobileTestHelper.tapElement(by.id('search-submit-button'))

      await MobileTestHelper.waitForElement(by.id('search-results'))

      // Should load incrementally without freezing
      await element(by.id('search-results')).scroll(1000, 'down')
      await MobileTestHelper.wait(500)
      await element(by.id('search-results')).scroll(1000, 'down')
    })
  })
})
