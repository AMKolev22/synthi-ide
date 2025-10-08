"use client"
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Rocket } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [showSecondLine, setShowSecondLine] = useState(false);
  const [secondLineText, setSecondLineText] = useState('');
  const featuresRef = useRef(null);

  const firstLine = "An IDE that truly";
  const secondLine = "understands you.";

  useEffect(() => {
    setMounted(true);

    // Typewriter effect for first line
    let i = 0;
    const firstLineInterval = setInterval(() => {
      if (i < firstLine.length) {
        setTypewriterText(firstLine.slice(0, i + 1));
        i++;
      } else {
        clearInterval(firstLineInterval);
        setShowSecondLine(true);
      }
    }, 50);

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
        }
      }, 50);

      return () => clearInterval(secondLineInterval);
    }
  }, [showSecondLine]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / scrollHeight) * 100;
      setScrollProgress(progress);

      if (featuresRef.current) {
        const rect = featuresRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.75 && rect.bottom > 0;
        if (isVisible && !featuresVisible) {
          setFeaturesVisible(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [featuresVisible]);

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Space Grotesk', sans-serif;
        }
        
        .font-mono {
          font-family: 'JetBrains Mono', monospace;
        }
        
        @keyframes scroll-bounce {
          0%, 100% {
            opacity: 0;
            transform: translateY(-10px);
          }
          50% {
            opacity: 1;
            transform: translateY(10px);
          }
        }
        .animate-scroll-bounce {
          animation: scroll-bounce 2s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .cursor-blink {
          animation: blink 1s infinite;
        }
      `}</style>

      <div className="fixed top-0 left-0 right-0 z-50 bg-[#131112]/80 backdrop-blur-md border-b border-[#E5E5E5]/5">
        <div className="px-8 py-4 flex items-center">
          <div className="flex items-center gap-3">
            <span className="text-[#E5E5E5] font-semibold text-lg tracking-tight">synthi</span>
            <span className="text-[#E5E5E5] font-semibold text-sm -ml-2 -mt-2 tracking-tight">26'</span>
          </div>
        </div>
      </div>

      <div 
        className="fixed right-8 z-50 transition-all duration-300 ease-out"
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

      <div className="absolute inset-0 h-screen opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(229, 229, 229, 0.5) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(229, 229, 229, 0.5) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="relative z-10 flex flex-col items-start justify-center min-h-screen px-32">
        <div 
          className={`flex items-center gap-2 mb-6 transition-all duration-1000 ml-2 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '0ms' }}
        >
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="text-emerald-400 text-sm font-medium">All systems operational</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-bold text-[#E5E5E5] tracking-tight">
            {typewriterText}
            {typewriterText.length < firstLine.length && (
              <span className="cursor-blink">|</span>
            )}
          </h1>
          {showSecondLine && (
            <h1 className="text-7xl font-bold text-[#E5E5E5] tracking-tight">
              {secondLineText}
              {secondLineText.length < secondLine.length && (
                <span className="cursor-blink">|</span>
              )}
            </h1>
          )}
        </div>

        <p 
          className={`text-[#AFAFAF] text-xl mt-6 max-w-xl leading-relaxed transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '600ms' }}
        >
          Built so you can focus on your ideas. It handles the rest itself. You'll love it.
        </p>

        <div 
          className={`flex gap-4 mt-6 transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '800ms' }}
        >
          <button 
            onClick={scrollToBottom}
            className="group relative px-8 py-3.5 bg-white text-black font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          >
            <span className="relative z-10 font-mono text-sm tracking-wide">JOIN WAITLIST</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#E5E5E5] to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>
      <div 
        ref={featuresRef}
        className="relative z-10 min-h-screen flex items-center justify-center px-20 py-32"
      >
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 
              className={`text-5xl font-bold text-[#E5E5E5] tracking-tight transition-all duration-1000 ${
                featuresVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}
            >
              Code <span className='text-[#327464] underline'>Beyond Hardware</span>,
              <br />
              <span className='inline-block mt-2'>Build at Instant.</span>
            </h2>
            
            <p className={`text-[#AFAFAF] text-lg leading-relaxed transition-all duration-1000 delay-200 ${
              featuresVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}>
            Your code, accelerated. With AI that understands context, predicts errors, and offers intelligent suggestions, building and delivering software has never been faster.
            </p>

            <div className="space-y-4 pt-4">
              {[
                { title: 'Bugs Fixed Before You Notice Them.', desc: 'Synthi scans every file in real time, detecting errors, offering intelligent suggestions, and guiding you to cleaner, smarter code, so you can focus on building, not debugging. ' },
                { title: 'Code Without Hardware Limits.', desc: 'Compile massive projects entirely in the cloud. Instant delivery, seamless performance - just like running locally, but infinitely scalable.' },
                { title: 'Collaborate Without Limits', desc: 'Integrated AI assistants help optimize, refactor, and guide your code, so your dreams come to life faster and smarter.' },
                { title: 'Seamless Collaboration', desc: 'Work together in real time, with AI-enhanced insights - share ideas, processes, and code effortlessly across the cloud.' }
              ].map((feature, i) => (
                <div 
                  key={i} 
                  className={`flex gap-4 items-start group cursor-pointer transition-all duration-1000 ${
                    featuresVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
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

          <div className={`relative transition-all duration-1000 ${
            featuresVisible ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-12 scale-95'
          }`}
          style={{ transitionDelay: '200ms' }}>
            <div className="relative bg-[#1a1a1a] border border-[#E5E5E5]/10 rounded-2xl p-10 space-y-6">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-[#E5E5E5] tracking-tight">
                  Be the first experience.
                </h3>
                <p className="text-[#AFAFAF]">
                  Join now so you can early access to Synthi when it releases.
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#E5E5E5]/20 rounded-lg text-[#E5E5E5] placeholder-[#AFAFAF] focus:outline-none focus:border-[#58A4B0] transition-colors duration-300"
                />
                
                <button className="w-full group relative px-8 py-4 bg-white text-black font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1">
                  <span className="relative z-10 font-mono text-sm tracking-wide">JOIN THE WAITLIST</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#E5E5E5] to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-[#AFAFAF] text-sm pt-2">
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-[#58A4B0] to-[#0C7C59] border-2 border-[#1a1a1a]"
                    />
                  ))}
                </div>
                <span>Join <strong className="text-[#E5E5E5]">2,847</strong> developers already on the list.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="relative z-10 py-8 border-t border-[#E5E5E5]/10">
        <div className="px-8 text-center">
          <p className="text-[#AFAFAF] text-sm"><span className='text-[#E5E5E5] font-semibold'>Expect soon.</span> synthi@2025</p>
        </div>
      </footer>
    </div>
  );
}