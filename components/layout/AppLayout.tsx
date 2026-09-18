"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/login/actions";

export function AppLayout({
  user,
  children,
}: {
  user: {
    name: string;
    email: string;
    role: "ADMIN" | "GURU";
  };
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const adminNavItems = [
    {
      group: "Utama",
      items: [{ href: "/admin", label: "Dashboard", icon: "📊" }],
    },
    {
      group: "Dokumen & Perangkat",
      items: [
        { href: "/admin/modul-ajar", label: "Modul Ajar", icon: "📚" },
        { href: "/admin/rpp", label: "RPP", icon: "📑" },
        { href: "/admin/lkpd", label: "LKPD Siswa", icon: "📋" },
      ],
    },
    {
      group: "Data Pembelajaran",
      items: [
        { href: "/admin/jadwal", label: "Jadwal Pelajaran", icon: "⏰" },
        { href: "/admin/absensi", label: "Rekap Presensi", icon: "📝" },
        { href: "/admin/nilai", label: "Rekap Penilaian", icon: "📈" },
      ],
    },
    {
      group: "Data Master",
      items: [
        { href: "/admin/sekolah", label: "Sekolah", icon: "🏫" },
        { href: "/admin/tahun-ajaran", label: "Tahun Ajaran", icon: "📅" },
        { href: "/admin/semester", label: "Semester", icon: "📑" },
        { href: "/admin/guru", label: "Guru", icon: "👨‍🏫" },
        { href: "/admin/siswa", label: "Siswa", icon: "🎒" },
        { href: "/admin/kelas", label: "Kelas", icon: "🚪" },
        { href: "/admin/mata-pelajaran", label: "Mata Pelajaran", icon: "📚" },
        { href: "/admin/penugasan-guru", label: "Penugasan Guru", icon: "📋" },
      ],
    },
  ];

  const guruNavItems = [
    {
      group: "Utama",
      items: [{ href: "/guru", label: "Dashboard", icon: "📊" }],
    },
    {
      group: "Perangkat Ajar",
      items: [
        { href: "/guru/modul-ajar", label: "Modul Ajar", icon: "📚" },
        { href: "/guru/rpp", label: "RPP", icon: "📑" },
        { href: "/guru/lkpd", label: "LKPD Siswa", icon: "📋" },
      ],
    },
    {
      group: "Pembelajaran",
      items: [
        { href: "/guru/absensi", label: "Presensi Siswa", icon: "📝" },
        { href: "/guru/nilai", label: "Nilai & Asesmen", icon: "📈" },
        { href: "/guru/jadwal", label: "Jadwal Saya", icon: "⏰" },
        { href: "/guru/kelas", label: "Kelas Saya", icon: "🚪" },
        { href: "/guru/siswa", label: "Siswa Saya", icon: "🎒" },
      ],
    },
  ];

  const navGroups = user.role === "ADMIN" ? adminNavItems : guruNavItems;

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-4 shrink-0">
        <div className="flex items-center gap-2 px-2 py-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            SD
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Manajemen Kelas</h1>
            <p className="text-[11px] text-zinc-500 capitalize">{user.role.toLowerCase()}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {group.group}
              </p>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User profile bottom */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="overflow-hidden pr-2">
            <p className="text-xs font-semibold truncate">{user.name}</p>
            <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Keluar"
              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-xs cursor-pointer"
            >
              🚪
            </button>
          </form>
        </div>
      </aside>

      {/* Main content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer"
            >
              ☰
            </button>
            <span className="text-sm font-bold">Manajemen Kelas SD</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-medium">
            {user.role}
          </span>
        </header>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-64 bg-white dark:bg-zinc-900 h-full p-4 flex flex-col z-10 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-sm">Menu Navigasi</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-zinc-500 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <nav className="flex-1 space-y-4 overflow-y-auto">
                {navGroups.map((group, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {group.group}
                    </p>
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                          pathname === item.href
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="overflow-hidden pr-2">
                  <p className="text-xs font-semibold truncate">{user.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                </div>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-xs"
                  >
                    Keluar
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
