'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Network,
  Printer,
  ChevronDown,
  LayoutGrid,
  Menu,
  Bell,
  Mail,
  Search,
  Grid
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import "@/src/app/globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isManajemenOpen, setIsManajemenOpen] = useState(true);

  const manajemenItems = [
    { name: 'Input Peserta', icon: Users, href: '/peserta', color: '#00d25b' },
    { name: 'Generate Bagan', icon: Network, href: '/generate', color: '#8f5fe8' },
    { name: 'Cetak Bagan', icon: Printer, href: '/cetak', color: '#ffab00' },
  ];

  return (
    <html lang="id">
      <body className="min-h-screen bg-[#000000] text-white flex antialiased">
        {/* Sidebar - Corona Dark (244px) */}
        <aside className="w-[244px] bg-[#191c24] flex flex-col fixed inset-y-0 z-50 no-print">

          {/* Logo Branding Style */}
          <div className="h-[70px] flex items-center px-6 mb-4">
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tighter text-white uppercase leading-tight italic">Bagan Turnamen</span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#0090e7] uppercase">Taekwondo</span>
            </div>
          </div>

          {/* Profile Mini Section */}
          <div className="px-6 mb-8 flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-600">
              <UserIcon size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Prabu Admin</span>
              <span className="text-[10px] text-[#6c7293]">Gold Member</span>
            </div>
            <ChevronDown size={12} className="ml-auto text-[#6c7293]" />
          </div>

          <p className="px-6 text-[10px] font-bold text-[#6c7293] uppercase tracking-widest mb-4">Navigation</p>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
            {/* Dashboard Link */}
            <Link href="/" className={`flex items-center gap-4 px-4 py-3 rounded-md transition-all group ${pathname === '/' ? 'text-white' : 'text-[#6c7293] hover:bg-[#0f1015]'}`}>
              <div className="p-2 rounded-lg bg-[#000000] text-[#fc424a]">
                <LayoutDashboard size={18} />
              </div>
              <span className="text-sm font-medium">Dashboard</span>
              {pathname === '/' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#fc424a]" />}
            </Link>

            {/* Manajemen Section */}
            <div className="pt-2">
              <button onClick={() => setIsManajemenOpen(!isManajemenOpen)} className="w-full flex items-center gap-4 px-4 py-3 text-[#6c7293] hover:bg-[#0f1015] rounded-md transition-colors group text-left">
                <div className="p-2 rounded-lg bg-[#000000] text-[#00d25b]">
                  <Grid size={18} />
                </div>
                <span className="text-sm font-medium flex-1">Manajemen</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isManajemenOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isManajemenOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-1 mt-1 ml-4 border-l border-[#2c2e33]">
                    {manajemenItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link key={item.name} href={item.href}
                          className={`flex items-center gap-3 px-6 py-2 transition-all group ${isActive ? 'text-white' : 'text-[#6c7293] hover:text-white'}`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: item.color }} />
                          <span className="text-xs font-medium">{item.name}</span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </aside>

        {/* Main Wrapper */}
        <div className="flex-1 ml-[244px] flex flex-col print-reset-margin">

          {/* Header/Navbar Corona Style */}
          <header className="h-[70px] bg-[#191c24] flex items-center justify-between px-8 border-b border-[#2c2e33] sticky top-0 z-40 no-print">
            <div className="flex items-center gap-6">
              <Menu size={20} className="text-[#6c7293] cursor-pointer" />
              <div className="hidden md:flex items-center bg-[#000000] px-4 py-2 rounded-md border border-[#2c2e33]">
                <Search size={14} className="text-[#6c7293] mr-2" />
                <input type="text" placeholder="Search projects" className="bg-transparent border-none outline-none text-xs text-white w-48" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-4 text-[#6c7293]">
                <Mail size={20} className="hover:text-white cursor-pointer" />
                <Bell size={20} className="hover:text-white cursor-pointer" />
              </div>
              <div className="h-6 w-[1px] bg-[#2c2e33]" />
              {/* Button removed per request */}
            </div>
          </header>

          {/* Content Area */}
          <div className="p-8 print-no-padding">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

function UserIcon({ size }: { size: number }) {
  return <Users size={size} />;
}
