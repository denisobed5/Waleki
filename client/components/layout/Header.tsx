import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import {
  Droplets,
  LayoutDashboard,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Code
} from 'lucide-react';

export function Header() {
  const { theme, actualTheme, setTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: true },
    { name: 'Devices', href: '/devices', icon: Settings, show: true },
    { name: 'API', href: '/apis', icon: Code, show: true },
  ];


  return (
    <header className="bg-blue-600 dark:bg-blue-800 border-b border-blue-700 dark:border-blue-900 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Droplets className="h-8 w-8 text-white" />
            <span className="text-xl font-bold text-white">Waleki</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavigationMenu>
              <NavigationMenuList className="space-x-6">
                {navigation.filter(item => item.show).map((item) => (
                  <NavigationMenuItem key={item.name}>
                    <NavigationMenuLink asChild>
                      <Link
                        to={item.href}
                        className={cn(
                          "flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                          location.pathname === item.href
                            ? "text-blue-100 bg-blue-700 dark:bg-blue-900"
                            : "text-blue-100 hover:text-white hover:bg-blue-700 dark:hover:bg-blue-900"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
              className="relative h-8 w-8 rounded-full text-white hover:bg-blue-700 dark:hover:bg-blue-900"
            >
              {actualTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>


            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-blue-700 dark:border-blue-900 py-4">
            <div className="space-y-1">
              {navigation.filter(item => item.show).map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 text-base font-medium rounded-md",
                    location.pathname === item.href
                      ? "text-blue-100 bg-blue-700 dark:bg-blue-900"
                      : "text-blue-100 hover:text-white hover:bg-blue-700 dark:hover:bg-blue-900"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
