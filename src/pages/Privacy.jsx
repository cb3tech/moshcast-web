import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-mosh-darker">
      {/* Header */}
      <div className="bg-mosh-dark border-b border-mosh-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-mosh-muted hover:text-mosh-light transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Moshcast
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-mosh-light mb-2">Privacy Policy</h1>
        <p className="text-mosh-muted mb-8">Last updated: December 25, 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-mosh-text">
          
          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">1. Introduction</h2>
            <p>
              Moshcast ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, and safeguard your information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium text-mosh-light mt-4 mb-2">Account Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email address (for account creation and communication)</li>
              <li>Username (for identification and Go Live feature)</li>
              <li>Password (stored securely using encryption)</li>
            </ul>

            <h3 className="text-lg font-medium text-mosh-light mt-4 mb-2">Content You Upload</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Music files you upload to your library</li>
              <li>Metadata associated with your music (artist, album, track info)</li>
              <li>Playlists you create</li>
            </ul>

            <h3 className="text-lg font-medium text-mosh-light mt-4 mb-2">Usage Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Basic usage analytics (features used, session duration)</li>
              <li>Device and browser information for compatibility</li>
              <li>Error logs for troubleshooting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain the Service</li>
              <li>To authenticate your account and secure your content</li>
              <li>To enable features like streaming and Go Live sessions</li>
              <li>To communicate service updates or support responses</li>
              <li>To improve the Service based on usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">4. Data Storage & Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your music files are stored on secure cloud infrastructure (Cloudflare R2)</li>
              <li>Account data is stored in encrypted databases</li>
              <li>We use HTTPS encryption for all data transmission</li>
              <li>Passwords are hashed and never stored in plain text</li>
              <li>Your content is private and only accessible by you (and Go Live guests you invite)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">5. Data Sharing</h2>
            <p className="mb-3">We do not sell your personal information. We may share data only in these cases:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> Third-party services that help operate the platform (hosting, storage)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Go Live Feature:</strong> When you host a session, listeners see your username and currently playing song</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">6. Your Rights & Controls</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> View your account information and uploaded content</li>
              <li><strong>Delete:</strong> Remove individual songs, playlists, or your entire account</li>
              <li><strong>Export:</strong> Download your data (contact support)</li>
              <li><strong>Correct:</strong> Update your account information at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">7. Cookies & Local Storage</h2>
            <p>
              We use browser local storage to save your preferences (favorites, playback settings). 
              We use essential cookies for authentication. We do not use third-party tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">8. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account data is retained while your account is active</li>
              <li>Uploaded content is retained until you delete it or close your account</li>
              <li>Upon account deletion, your data is permanently removed within 30 days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">9. Children's Privacy</h2>
            <p>
              Moshcast is not intended for users under 13 years of age. We do not knowingly collect 
              information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify users of significant 
              changes via email or in-app notification.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">11. Contact Us</h2>
            <p>
              For privacy-related questions or requests, contact us at{' '}
              <a href="mailto:privacy@moshcast.com" className="text-mosh-accent hover:underline">privacy@moshcast.com</a>.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-mosh-border text-center text-mosh-muted text-sm">
          <p>© 2025 Moshcast™ | A Coinloader Company</p>
        </div>
      </div>
    </div>
  )
}
