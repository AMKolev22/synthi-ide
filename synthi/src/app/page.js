"use client"
import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Rocket } from "lucide-react";
import { toast } from "sonner";

/* ---------- Star component (receives scrollY from parent for parallax) ---------- */
const Star = ({ top, left, size, delay, duration, depth, scrollY }) => {
  const parallaxOffset = (scrollY * (0.5 / depth)) % (window.innerHeight + 100);
  return (
    <div
      className="absolute rounded-full bg-white"
      style={{
        top: `${top - parallaxOffset}px`,
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        boxShadow: `0 0 ${size * 2}px rgba(255,255,255,0.8), 0 0 ${size * 4}px rgba(255,255,255,0.4)`,
        animation: `twinkle ${duration}s ${delay}s infinite`,
        opacity: 0.9 / depth,
        pointerEvents: "none",
      }}
    />
  );
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [businessVisible, setBusinessVisible] = useState(false);
  const [typewriterText, setTypewriterText] = useState("");
  const [showSecondLine, setShowSecondLine] = useState(false);
  const [secondLineText, setSecondLineText] = useState("");
  const [typewriterComplete, setTypewriterComplete] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [email, setEmail] = useState("");
  const [stars, setStars] = useState([]);
  const featuresRef = useRef(null);
  const businessRef = useRef(null);

  const firstLine = "The IDE that truly";
  const secondLine = "understands you.";

  /* ---------- Efficient scroll handling ---------- */
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      const y = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = scrollHeight > 0 ? (y / scrollHeight) * 100 : 0;
          setScrollY(y);
          setScrollProgress(progress);
          
          if (featuresRef.current) {
            const rect = featuresRef.current.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight * 0.75 && rect.bottom > 0;
            if (isVisible && !featuresVisible) setFeaturesVisible(true);
          }
          
          if (businessRef.current) {
            const rect = businessRef.current.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight * 0.75 && rect.bottom > 0;
            if (isVisible && !businessVisible) setBusinessVisible(true);
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [featuresVisible, businessVisible]);

  /* ---------- Mount: stars + typewriter ---------- */
  useEffect(() => {
    setMounted(true);
    fetchWaitlistCount();

    const generated = [];
    for (let i = 0; i < 200; i++) {
      generated.push({
        id: i,
        top: Math.random() * (window.innerHeight * 1.5),
        left: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2,
        depth: Math.random() * 3 + 1,
      });
    }
    setStars(generated);

    let i = 0;
    const firstLineInterval = setInterval(() => {
      if (i < firstLine.length) {
        setTypewriterText(firstLine.slice(0, i + 1));
        i++;
      } else {
        clearInterval(firstLineInterval);
        setShowSecondLine(true);
      }
    }, 45);

    return () => clearInterval(firstLineInterval);
  }, []);

  useEffect(() => {
    if (showSecondLine) {
      let j = 0;
      const secondLineInterval = setInterval(() => {
        if (j < secondLine.length) {
          setSecondLineText(secondLine.slice(0, j + 1));
          j++;
        } else {
          clearInterval(secondLineInterval);
          setTypewriterComplete(true);
        }
      }, 45);
      return () => clearInterval(secondLineInterval);
    }
  }, [showSecondLine]);

/* ---------- Waitlist APIs ---------- */
const fetchWaitlistCount = async () => {
  try {
    const response = await fetch("/api/waitlist");
    const data = await response.json();
    setWaitlistCount(data.count || 0);
  } catch (error) {
    console.error("Failed to fetch waitlist count:", error);
  }
};

const handleSubmit = async () => {
  if (!email || !email.trim()) {
    toast.error("Please enter a valid email");
    return;
  }

  const fetchPromise = fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() }),
  }).then(async (response) => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to join waitlist");
    return data;
  });

  toast.promise(fetchPromise, {
    loading: "Joining waitlist...",
    success: (data) => {
      if (data.message === "Email already on waitlist") return "You're already on the waitlist!";
      setEmail("");
      fetchWaitlistCount();
      return "Successfully joined the waitlist 🎉";
    },
    error: (error) => error.message || "Something went wrong. Please try again.",
  });
};

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  };

  const baseOpacity = 0;
  const extraFromScroll = Math.min((scrollProgress / 100) * 0.7, 0.7);
  const overlayOpacity = Math.min(baseOpacity + extraFromScroll, 0.7);
  const showScrollIndicator = scrollProgress < 3;

  return (
    <div className="relative min-h-screen">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        body { font-family: 'Space Grotesk', sans-serif; }

        @keyframes twinkle {
          0%,100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes scroll-bounce {
          0%,100% { opacity: 0; transform: translateY(-6px); }
          50% { opacity: 1; transform: translateY(6px); }
        }
        @keyframes blink { 0%,100% { opacity: 1 } 50% { opacity: 0 } }
        .cursor-blink { animation: blink 1s infinite; }
        @keyframes drawLine {
          from { 
            stroke-dashoffset: 1000;
          }
          to { 
            stroke-dashoffset: 0;
          }
        }
        .draw-line-animated path { 
          animation: drawLine 2s ease-in-out 1.2s forwards;
        }
      `}</style>

      {/* Top nav */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#131112]/80 backdrop-blur-md border-b border-[#E5E5E5]/5">
        <div className="px-8 py-4 flex items-center">
          <div className="flex items-center gap-3">
            <span className="text-[#E5E5E5] font-semibold text-lg tracking-tight">synthi</span>
            <span className="text-[#E5E5E5] font-semibold text-sm -ml-2 -mt-2 tracking-tight">26'</span>
          </div>
        </div>
      </div>

      <div 
        className="fixed right-4 z-50 transition-all duration-300 ease-out"
        style={{ 
          top: `${Math.min(scrollProgress * 0.8 + 10, 85)}%`,
          opacity: scrollProgress > 5 ? 1 : 0
        }}
      >
        <div className="relative">
          <Rocket 
            className="text-[#58A4B0] transform rotate-180" 
            size={32}
            style={{
              filter: 'drop-shadow(0 0 8px rgba(88, 164, 176, 0.6))'
            }}
          />
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-[#58A4B0] to-transparent opacity-60" />
        </div>
      </div>

      <div className="fixed inset-0 bg-[#131112]" />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <Star key={star.id} {...star} scrollY={scrollY} />
        ))}
      </div>

      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-[#131112]/50 to-[#131112] pointer-events-none" />

      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,${overlayOpacity * 0.35}) 0%, rgba(0,0,0,${overlayOpacity}) 100%)`,
        }}
      />

      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-5 z-60 transition-all duration-400 ${
          showScrollIndicator ? "opacity-100" : "opacity-0 -translate-y-6 pointer-events-none"
        }`}
        aria-hidden={!showScrollIndicator}
      >
        <div className="flex flex-col items-center">
          <div className="rounded-full -pb-4 text-[#AFAFAF]">
            <ChevronDown className="animate-bounce" size={22} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-start justify-center min-h-screen px-8 md:px-32">
        <div
          className={`flex items-center gap-2 mb-2 transition-all duration-1000 ml-2 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "0ms" }}
        >
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="text-emerald-400 text-sm font-medium">All systems operational</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-bold text-[#E5E5E5] tracking-tight">
            {typewriterText}
            {!showSecondLine && typewriterText.length < firstLine.length && <span className="cursor-blink">|</span>}
          </h1>
          {showSecondLine && (
            <h1 className="text-5xl md:text-7xl font-bold text-[#E5E5E5] tracking-tight">
              {secondLineText}
              {!typewriterComplete && secondLineText.length < secondLine.length && <span className="cursor-blink">|</span>}
              {typewriterComplete && <span className="cursor-blink">|</span>}
            </h1>
          )}
        </div>

        <p
          className={`text-[#AFAFAF] text-lg md:text-xl mt-6 max-w-xl leading-relaxed transition-all duration-1000 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          Built so you can focus on your ideas. It handles the rest itself. You'll love it.
        </p>

        <div
          className={`flex gap-4 mt-6 transition-all duration-1000 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "800ms" }}
        >
          <button
            onClick={scrollToBottom}
            className="group relative px-6 md:px-8 py-3.5 bg-white text-black font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          >
            <span className="relative z-10 font-mono text-sm tracking-wide">JOIN WAITLIST</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#E5E5E5] to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>

      {/* Business Model */}
      <div ref={businessRef} className="relative z-10 min-h-screen flex items-center justify-center px-6 md:px-20 py-20 md:py-32">
        <div className="max-w-6xl w-full space-y-16">
          <div className="text-center space-y-6">
            <h2
              className={`text-4xl md:text-6xl font-bold text-[#E5E5E5] tracking-tight transition-all duration-1000 ${
                businessVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: "200ms" }}
            >
              Power for <span className="text-[#58A4B0]">Everyone</span>.
              <br />
              <span className="text-3xl md:text-5xl text-[#AFAFAF]">
                Premium for the <span className="inline-block relative whitespace-nowrap">
                  Ambitious
                  <svg 
                    className={`absolute left-0 -bottom-2 w-full h-3 pointer-events-none ${businessVisible ? 'draw-line-animated' : ''}`}
                    viewBox="0 0 200 12" 
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="underlineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#58A4B0' }} />
                        <stop offset="100%" style={{ stopColor: '#327464' }} />
                      </linearGradient>
                    </defs>
                    <path
                      d="M2,8 Q25,4 50,7 T100,8 T150,7 T198,8"
                      fill="none"
                      stroke="url(#underlineGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="1000"
                      strokeDashoffset="1000"
                      style={{ opacity: 1 }}
                    />
                  </svg>
                </span>.
              </span>
            </h2>

            <p
              className={`text-[#AFAFAF] text-lg md:text-xl leading-relaxed max-w-3xl mx-auto transition-all duration-1000 ${
                businessVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
              Start building for free. Unlock advanced AI reasoning when you're ready to scale.
            </p>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-1000 ${
              businessVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
            style={{ transitionDelay: "600ms" }}
          >
            {/* Free Tier */}
            <div className="relative group bg-[#1a1a1a] border border-[#E5E5E5]/10 rounded-2xl p-8 hover:border-[#58A4B0]/30 transition-all duration-300">
              <div className="absolute -top-3 left-6">
                <span className="bg-[#58A4B0] text-black px-4 py-1 rounded-full text-sm font-bold">FREE FOREVER</span>
              </div>
              <div className="space-y-6 mt-4">
                <div>
                  <h3 className="text-3xl font-bold text-[#E5E5E5] mb-2">Core</h3>
                  <p className="text-[#AFAFAF]">Everything you need to build great software.</p>
                </div>
                <div className="space-y-3">
                  {[
                    "Real-time code analysis",
                    "Cloud-based compilation",
                    "Smart code suggestions",
                    "Seamless collaboration",
                    "Unlimited projects"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#58A4B0]/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-[#58A4B0]" />
                      </div>
                      <span className="text-[#E5E5E5]">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Premium Tier */}
            <div className="relative group bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#58A4B0] rounded-2xl p-8 shadow-lg shadow-[#58A4B0]/20">
              <div className="absolute -top-3 left-6">
                <span className="bg-gradient-to-r from-[#58A4B0] to-[#327464] text-white px-4 py-1 rounded-full text-sm font-bold">PREMIUM</span>
              </div>
              <div className="space-y-6 mt-4">
                <div>
                  <h3 className="text-3xl font-bold text-[#E5E5E5] mb-2">Pro</h3>
                  <p className="text-[#AFAFAF]">For developers who demand more.</p>
                </div>
                <div className="space-y-3">
                  {[
                    "Everything in Core",
                    "Advanced AI reasoning",
                    "Priority compilation",
                    "Enhanced model access",
                    "Premium support"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#58A4B0] flex items-center justify-center mt-0.5 flex-shrink-0">
                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-[#E5E5E5] font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom guarantee */}
          <div
            className={`text-center transition-all duration-1000 ${
              businessVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
            style={{ transitionDelay: "800ms" }}
          >
            <div className="inline-flex items-center gap-3 bg-[#1a1a1a] border border-[#E5E5E5]/10 rounded-full px-8 py-4">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[#E5E5E5] text-lg font-semibold">Your work is yours. Forever.</span>
            </div>
            <p className="text-[#AFAFAF] text-sm mt-4 max-w-2xl mx-auto">
              No lock-in, no data hostage. Export everything, anytime. We're here to empower you, not trap you.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div ref={featuresRef} className="relative z-10 min-h-screen flex items-center justify-center px-6 md:px-20 py-20 md:py-32">
        <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
          <div className="space-y-6">
            <h2
              className={`text-3xl md:text-5xl font-bold text-[#E5E5E5] tracking-tight transition-all duration-1000 ${
                featuresVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
              }`}
            >
              Code <span className="text-[#327464] underline">Beyond Hardware</span>,<br />
              <span className="inline-block mt-2">Build at <span>Instant</span>.</span>
            </h2>

            <p
              className={`text-[#AFAFAF] text-base md:text-lg leading-relaxed transition-all duration-1000 delay-200 ${
                featuresVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
              }`}
            >
              Your code, accelerated. With AI that understands context, predicts errors, and offers intelligent suggestions, building and delivering software has never been faster.
            </p>

            <div className="space-y-4 pt-2">
              {[
                { title: "Bugs Fixed Before You Notice Them.", desc: "Synthi scans every file in real time, detecting errors, offering intelligent suggestions, and guiding you to cleaner, smarter code, so you can focus on building, not debugging. " },
                { title: "Code Without Hardware Limits.", desc: "Compile massive projects entirely in the cloud. Instant delivery, seamless performance - just like running locally, but infinitely scalable." },
                { title: "Collaborate Without Limits", desc: "Integrated AI assistants help optimize, refactor, and guide your code, so your dreams come to life faster and smarter." },
                { title: "Seamless Collaboration", desc: "Work together in real time, with AI-enhanced insights - share ideas, processes, and code effortlessly across the cloud." }
              ].map((feature, i) => (
                <div
                  key={i}
                  className={`flex gap-4 items-start group cursor-pointer transition-all duration-1000 ${
                    featuresVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
                  }`}
                  style={{ transitionDelay: `${400 + i * 150}ms` }}
                >
                  <div className="w-2 h-2 rounded-full bg-[#58A4B0] mt-2 group-hover:scale-150 transition-transform duration-300" />
                  <div>
                    <h3 className="text-[#E5E5E5] font-semibold text-lg group-hover:text-[#58A4B0] transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-[#AFAFAF] text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`relative transition-all duration-1000 ${featuresVisible ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-12 scale-95"}`} style={{ transitionDelay: "200ms" }}>
            <div className="relative bg-[#1a1a1a] border border-[#E5E5E5]/10 rounded-2xl p-6 md:p-10 space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-bold text-[#E5E5E5] tracking-tight">Be the first to experience.</h3>
                <p className="text-[#AFAFAF]">Join now so you get early access to Synthi when it releases.</p>
              </div>

              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#E5E5E5]/20 rounded-lg text-[#E5E5E5] placeholder-[#AFAFAF] focus:outline-none focus:border-[#58A4B0] transition-colors duration-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <button onClick={handleSubmit} className="w-full group relative px-6 py-3 bg-white text-black font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1">
                  <span className="relative z-10 font-mono text-sm tracking-wide">JOIN THE WAITLIST</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#E5E5E5] to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-[#AFAFAF] text-sm pt-2">
                <div className="w-2 h-2 bg-emerald-400 animate-pulse rounded-lg" />
                <span>Join <strong className="text-[#E5E5E5]">{waitlistCount}</strong> developers already on the list.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-[#E5E5E5]/10">
        <div className="px-8 text-center space-y-3">
          <p className="text-[#AFAFAF] text-sm">
            <span className="text-[#E5E5E5] font-semibold">Expect soon.</span> Inquiries: dev@synthi.app
          </p>
          <p className="text-[#AFAFAF] text-sm">
            Built by{" "}
            <a
              href="https://linkedin.com/in/amkolev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#58A4B0] hover:text-[#327464] transition-colors duration-300 font-medium"
            >
              Alexander Kolev
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}