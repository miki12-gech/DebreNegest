import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-orthodox-darker">
      <Sidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 orthodox-pattern">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
