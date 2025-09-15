import { Link } from 'react-router-dom';
// import { useAuth } from '@/contexts/AuthContext';
import { Droplets, Github, Mail, Shield, Activity } from 'lucide-react';

export function Footer() {
  // Demo mode: show public navigation

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-blue-600 dark:bg-blue-800 border-t border-blue-700 dark:border-blue-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Droplets className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">Waleki</span>
            </div>
            <p className="text-blue-100 text-sm mb-4">
              Water Level Monitoring System from Kisima. Real-time monitoring of water levels
              with intelligent analytics and reporting.
            </p>
            <div className="flex space-x-4">
              <a
                href="mailto:support@waleki.com"
                className="text-blue-100 hover:text-white transition-colors"
                aria-label="Email support"
              >
                <Mail className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/waleki"
                className="text-blue-100 hover:text-white transition-colors"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Navigation
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/dashboard"
                  className="text-blue-100 hover:text-white transition-colors text-sm"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/devices"
                  className="text-blue-100 hover:text-white transition-colors text-sm"
                >
                  Device Management
                </Link>
              </li>
            </ul>
          </div>

          {/* System Status */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              System
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm">
                <Activity className="h-4 w-4 text-green-400" />
                <span className="text-blue-100">System Status: Online</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <Shield className="h-4 w-4 text-blue-300" />
                <span className="text-blue-100">Security: Active</span>
              </li>
            </ul>
          </div>

          {/* Support & Info */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:support@waleki.com"
                  className="text-blue-100 hover:text-white transition-colors text-sm"
                >
                  Technical Support
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@waleki.com"
                  className="text-blue-100 hover:text-white transition-colors text-sm"
                >
                  General Inquiries
                </a>
              </li>
              <li>
                <span className="text-blue-100 text-sm">Version 1.0.0</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-blue-700 dark:border-blue-900">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-blue-100 text-sm">
              © {currentYear} Waleki (Water Level from Kisima). All rights reserved.
            </p>
            <div className="mt-4 sm:mt-0 flex space-x-6">
              <a
                href="/privacy"
                className="text-blue-100 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-blue-100 hover:text-white text-sm transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
