import Link from 'next/link'
import { Github, Twitter, Linkedin } from 'lucide-react'
import { useAppConfig } from '@/contexts/app-config-context'

export function Footer() {
  const { config } = useAppConfig()
  const { branding, social, legal } = config

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              {branding.logo && (
                <img src={branding.logo} alt={branding.appName} className="h-6 w-auto" />
              )}
              <span className="text-lg font-semibold">{branding.appName}</span>
            </div>
            {branding.tagline && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {branding.tagline}
              </p>
            )}
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {social.twitter && (
                <a
                  href={social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {social.github && (
                <a
                  href={social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Github className="h-5 w-5" />
                </a>
              )}
              {social.linkedin && (
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="#features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/docs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Contact
                </Link>
              </li>
              {legal.supportEmail && (
                <li>
                  <a 
                    href={`mailto:${legal.supportEmail}`}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Email Support
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {legal.privacyPolicyUrl && (
                <li>
                  <Link href={legal.privacyPolicyUrl} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
              )}
              {legal.termsOfServiceUrl && (
                <li>
                  <Link href={legal.termsOfServiceUrl} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Terms of Service
                  </Link>
                </li>
              )}
              {legal.cookiePolicyUrl && (
                <li>
                  <Link href={legal.cookiePolicyUrl} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Cookie Policy
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} {branding.companyName || branding.appName}. All rights reserved.
            </p>
            
            {branding.websiteUrl && (
              <a 
                href={branding.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mt-4 md:mt-0"
              >
                Visit our website →
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}