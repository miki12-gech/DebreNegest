import Link from "next/link";
import { Cross, BookOpen, MessageCircle, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: BookOpen,
    title: "Spiritual Learning",
    description: "Access structured lessons organized by church classes (ክፍልታት) with content curated by class administrators.",
  },
  {
    icon: MessageCircle,
    title: "Community Chat",
    description: "Connect with fellow members through private messages and class group discussions in real time.",
  },
  {
    icon: Sparkles,
    title: "Ask the Fathers",
    description: "Get answers to theological questions grounded in Orthodox teachings, Scripture, and Church Fathers.",
  },
  {
    icon: Users,
    title: "Community Feed",
    description: "Share posts, announcements, and engage with your community through likes, comments, and discussions.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-orthodox-darker orthodox-pattern">
      {/* Header */}
      <header className="border-b border-orthodox-gold/10 bg-orthodox-darker/95 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orthodox-gold/10">
              <Cross className="h-6 w-6 text-orthodox-gold" />
            </div>
            <span className="text-lg font-bold text-orthodox-gold tracking-wide">
              ደብረ ነገስት
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Join Us</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orthodox-gold/5 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orthodox-gold/10 border border-orthodox-gold/20 text-orthodox-gold text-sm mb-8">
            <Cross className="h-4 w-4" />
            <span>ደብረ ህሩያን ነገስት አብርሃ ወ አጽብሃ</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-orthodox-parchment mb-6 leading-tight">
            ትምህርት ሰንበት
            <br />
            <span className="text-orthodox-gold">Digital Platform</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-orthodox-parchment/60 mb-10">
            A modern digital platform for Ethiopian Orthodox Sunday School community.
            Learn, connect, and grow together in faith through structured education,
            real-time communication, and AI-powered theological knowledge.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-base px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-base px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-orthodox-parchment mb-4">
            Everything Your Community Needs
          </h2>
          <p className="text-orthodox-parchment/50 max-w-xl mx-auto">
            A comprehensive platform combining spiritual education, social interaction,
            and modern technology.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl border border-orthodox-gold/10 bg-orthodox-dark/50 hover:border-orthodox-gold/20 hover:bg-orthodox-dark/80 transition-all duration-300"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orthodox-gold/10 mb-4 group-hover:bg-orthodox-gold/20 transition-colors">
                <feature.icon className="h-6 w-6 text-orthodox-gold" />
              </div>
              <h3 className="text-lg font-semibold text-orthodox-parchment mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-orthodox-parchment/50 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Classes Preview */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-orthodox-gold/10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-orthodox-parchment mb-4">
            Church Classes (ክፍልታት)
          </h2>
          <p className="text-orthodox-parchment/50">
            Organized learning and collaboration across multiple departments
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {["መዝሙር", "ትምህርቲ", "ኪነጥበብ", "አባላት ጉዳይ", "ኦዲት እና ኢንስፔክሽን", "ልምዓት"].map(
            (className) => (
              <div
                key={className}
                className="flex items-center justify-center p-6 rounded-xl border border-orthodox-gold/10 bg-orthodox-dark/30 text-orthodox-gold font-medium hover:bg-orthodox-gold/5 transition-colors"
              >
                {className}
              </div>
            )
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-orthodox-gold/10 bg-orthodox-darker">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Cross className="h-5 w-5 text-orthodox-gold" />
            <span className="font-bold text-orthodox-gold">ደብረ ነገስት</span>
          </div>
          <p className="text-sm text-orthodox-parchment/40">
            ደብረ ህሩያን ነገስት አብርሃ ወ አጽብሃ ትምህርት ሰንበት Digital Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
