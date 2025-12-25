import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Terms() {
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
        <h1 className="text-3xl font-bold text-mosh-light mb-2">Terms of Service</h1>
        <p className="text-mosh-muted mb-8">Last updated: December 25, 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-mosh-text">
          
          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Moshcast ("Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">2. Description of Service</h2>
            <p>
              Moshcast is a personal music streaming platform that allows users to upload, store, and stream 
              their own music library from any device. The Service is intended for personal, non-commercial use only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">3. User Responsibilities</h2>
            <p className="mb-3">By using Moshcast, you represent and warrant that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You own or have the legal right to upload and stream all content you add to the Service</li>
              <li>Your use complies with all applicable copyright laws and regulations</li>
              <li>You will not upload content that infringes on third-party intellectual property rights</li>
              <li>You will not use the Service for illegal distribution or sharing of copyrighted material</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">4. Acceptable Use</h2>
            <p className="mb-3">The Service is designed for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Streaming music you have personally purchased (CDs, digital downloads)</li>
              <li>Streaming music you have legally acquired for personal use</li>
              <li>Private listening and personal music library management</li>
            </ul>
            <p className="mt-3">
              The "Go Live" feature is intended for sharing listening experiences with friends and family 
              in private sessions, not for public broadcasting or commercial purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">5. Copyright & DMCA Compliance</h2>
            <p className="mb-3">
              Moshcast respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA). 
              We will respond to valid takedown notices and may terminate accounts of repeat infringers.
            </p>
            <p>
              To report copyright infringement, contact us at{' '}
              <a href="mailto:dmca@moshcast.com" className="text-mosh-accent hover:underline">dmca@moshcast.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">6. Content Storage & Data</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your uploaded content is stored securely and is only accessible by you (and friends you invite to live sessions)</li>
              <li>Storage limits apply based on your subscription plan</li>
              <li>We reserve the right to remove content that violates these terms</li>
              <li>You may delete your content and account at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">7. Service Availability</h2>
            <p>
              Moshcast is provided "as is" without warranties of any kind. We do not guarantee uninterrupted 
              access to the Service and may modify, suspend, or discontinue features at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Moshcast and its operators shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, 
              including but not limited to loss of data, loss of profits, or service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">9. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms, engage in 
              copyright infringement, or abuse the Service. You may also close your account at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">10. Changes to Terms</h2>
            <p>
              We may update these Terms of Service from time to time. Continued use of the Service after 
              changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-mosh-light mb-4">11. Contact</h2>
            <p>
              For questions about these Terms, contact us at{' '}
              <a href="mailto:support@moshcast.com" className="text-mosh-accent hover:underline">support@moshcast.com</a>.
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
