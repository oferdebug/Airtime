import { Github, Linkedin, Mail, Mic2, Twitter } from "lucide-react";
import Link from "next/link";
import { NewsletterSignup } from "./NewsletterSignup";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-brand-200/50 bg-gradient-to-b from-white via-brand-50/30 to-white">
      {/* Subtle mesh background */}
      <div className="absolute inset-0 mesh-background-subtle opacity-50" />

      <div className="container mx-auto px-5 py-16 md:py-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Newsletter Section */}
          <div className="mb-12">
            <NewsletterSignup />
          </div>

          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl gradient-brand shadow-lg">
                  <Mic2 className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-extrabold gradient-brand-text">
                  Airtime
                </span>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-6 max-w-sm">
                Transform your podcasts into searchable, AI-powered content. Get
                transcripts, summaries, and social posts in minutes.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-4">
                <a
                  href="https://twitter.com/airtime"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg glass-card hover-lift transition-all group"
                  aria-label="Twitter profile"
                >
                  <Twitter className="h-5 w-5 text-slate-600 group-hover:text-brand-600 transition-colors" />
                </a>
                <a
                  href="https://github.com/airtime"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg glass-card hover-lift transition-all group"
                  aria-label="GitHub profile"
                >
                  <Github className="h-5 w-5 text-slate-600 group-hover:text-brand-600 transition-colors" />
                </a>
                <a
                  href="https://linkedin.com/company/airtime"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg glass-card hover-lift transition-all group"
                  aria-label="LinkedIn profile"
                >
                  <Linkedin className="h-5 w-5 text-slate-600 group-hover:text-brand-600 transition-colors" />
                </a>
                <Link
                  href="mailto:hello@airtime.com"
                  className="p-2 rounded-lg glass-card hover-lift transition-all group"
                  aria-label="Email"
                >
                  <Mail className="h-5 w-5 text-slate-600 group-hover:text-brand-600 transition-colors" />
                </Link>
              </div>
            </div>

            {/* Product Section */}
            <div>
              <h3 className="font-extrabold mb-5 text-slate-950 text-sm uppercase tracking-wider">
                Product
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/features"
                    className="text-slate-600 hover:text-brand-600 text-sm inline-block hover:translate-x-1 transition-all"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-slate-600 hover:text-brand-600 text-sm inline-block hover:translate-x-1 transition-all"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-slate-600 hover:text-brand-600 text-sm inline-block hover:translate-x-1 transition-all"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/integrations"
                    className="text-slate-600 hover:text-brand-600 text-sm inline-block hover:translate-x-1 transition-all"
                  >
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Section */}
            <div>
              <h3 className="font-extrabold mb-5 text-slate-950 text-sm uppercase tracking-wider">
                Company
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/about"
                    className="text-slate-600 hover:text-brand-600 text-sm inline-block hover:translate-x-1 transition-all"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-slate-600 hover:text-brand-600 text-sm inline-block hover:translate-x-1 transition-all"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-slate-600 hover:text-brand-600 text-sm inline-block hover:translate-x-1 transition-all"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-slate-600 hover:text-brand-600 text-sm inline-block hover:translate-x-1 transition-all"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Section */}
            <div>
              <h3 className="font-extrabold mb-5 text-slate-950 text-sm uppercase tracking-wider">
                Legal
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/privacy"
                    className="text-slate-600 hover:text-brand-600 text-sm inline-block hover:translate-x-1 transition-all"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-slate-600 hover:text-brand-600 text-sm inline-block hover:translate-x-1 transition-all"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookies"
                    className="text-slate-600 hover:text-brand-600 text-sm inline-block hover:translate-x-1 transition-all"
                  >
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="text-slate-600 hover:text-brand-600 text-sm inline-block hover:translate-x-1 transition-all"
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-brand-200/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-600" suppressHydrationWarning>
                © {currentYear} Airtime. All rights reserved. This is a demo
                project.
              </p>
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  All systems operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
