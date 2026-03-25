import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#000d24] text-white flex items-center justify-center px-6 font-sans">
      <div className="max-w-lg w-full text-center">
        {/* Glowing 404 */}
        <div className="mb-10">
          <h2 className="text-[120px] md:text-[160px] font-serif font-light leading-none bg-linear-to-b from-white/20 to-transparent bg-clip-text text-transparent select-none">
            404
          </h2>
        </div>

        {/* Signal icon */}
        <div className="w-16 h-16 mx-auto mb-8 rounded-full bg-[#0027ED]/10 border border-[#0027ED]/20 flex items-center justify-center">
          <Search className="w-7 h-7 text-[#c0caff]" />
        </div>

        <p className="text-[10px] font-light uppercase tracking-[0.4em] text-[#aebcff] mb-4">
          Signal Lost
        </p>

        <h1 className="text-2xl md:text-3xl font-serif font-light mb-4 leading-tight">
          Page Not Found
        </h1>

        <p className="text-sm font-light text-white/40 leading-relaxed max-w-sm mx-auto mb-10">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          It may have been a broken link or a mistyped URL.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/"
            className="flex items-center gap-2 px-7 py-4 bg-[#0027ED] hover:bg-[#0021c7] text-white rounded-2xl text-[10px] font-light uppercase tracking-[0.25em] transition-all active:scale-95"
          >
            <Home className="w-3.5 h-3.5" />
            Go Home
          </Link>
          <Link
            href="/nxring"
            className="flex items-center gap-2 px-7 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-[10px] font-light uppercase tracking-[0.25em] transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Explore NxRing
          </Link>
        </div>

        {/* Decorative line */}
        <div className="mt-16 flex items-center justify-center gap-3">
          <div className="w-8 h-px bg-white/10" />
          <p className="text-[9px] font-light uppercase tracking-[0.3em] text-white/20">
            NxRing by Nexcura
          </p>
          <div className="w-8 h-px bg-white/10" />
        </div>
      </div>
    </div>
  );
}
