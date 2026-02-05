import { Github, Linkedin, Mail, Mic2, Twitter } from "lucide-react";
import Link from "next/link";
import { NewsletterSignup } from "./NewsletterSignup";

const footerLinks = {
  Product: [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/integrations", label: "Integrations" },
  ],
  Company: [
    { href: "/about", label: "About Us" },
    { href: "/blog", label: "Blog" },
    { href: "/careers", label: "Careers" },
    { href: "/contact", label: "Contact" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/cookies", label: "Cookie Policy" },
    { href: "/security", label: "Security" },
  ],
} as const;

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-brand-200/50 bg-linear-to-b from-white via-brand-50/30 to-white">
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
                <a
                  href="mailto:hello@airtime.com"
                  className="p-2 rounded-lg glass-card hover-lift transition-all group"
                  aria-label="Email"
                >
                  <Mail className="h-5 w-5 text-slate-600 group-hover:text-brand-600 transition-colors" />
                </a>
              </div>
            </div>

            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section}>
                <h3 className="font-extrabold mb-5 text-slate-950 text-sm uppercase tracking-wider">
                  {section}
                </h3>
                <ul className="space-y-3">
                  {links.map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-slate-600 hover:text-brand-600 text-sm inline-block hover:translate-x-1 transition-all"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
