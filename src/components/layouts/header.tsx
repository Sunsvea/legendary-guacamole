'use client';

import { Mountain } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mountain className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Alpine Route Optimizer
            </h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#routes" className="text-gray-600 hover:text-blue-600 transition-colors">
              Routes
            </a>
            <a href="#weather" className="text-gray-600 hover:text-blue-600 transition-colors">
              Weather
            </a>
            <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">
              About
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}