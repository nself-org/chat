/**
 * Bot Templates Index
 * Pre-built bot templates for quick setup
 */

export { createWelcomeBot, welcomeBotTemplate } from './welcome-bot'
export { createFAQBot, faqBotTemplate } from './faq-bot'
export { createPollBot, pollBotTemplate } from './poll-bot'
export { createSchedulerBot, schedulerBotTemplate } from './scheduler-bot'
export { createStandupBot, standupBotTemplate } from './standup-bot'

/**
 * All available templates
 */
export const allTemplates = [
  welcomeBotTemplate,
  faqBotTemplate,
  pollBotTemplate,
  schedulerBotTemplate,
  standupBotTemplate,
] as const

/**
 * Get template by ID
 */
export function getTemplate(id: string) {
  return allTemplates.find(t => t.id === id)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string) {
  return allTemplates.filter(t => t.category === category)
}

/**
 * Get featured templates
 */
export function getFeaturedTemplates() {
  return allTemplates.filter(t => t.isFeatured)
}
