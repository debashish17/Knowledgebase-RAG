
import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, MessageSquare, Calendar, Sparkles, Zap, Brain, CheckCircle, ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


export default function StudyBuddyLanding() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const features = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: "Upload Study Materials",
      description: "Upload PDFs, documents, and notes. Your AI assistant analyzes everything instantly.",
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Context-Aware Answers",
      description: "Ask questions and get detailed, accurate answers based on your uploaded materials.",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80"
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Document Summarization",
      description: "Get concise summaries of lengthy documents to grasp key concepts quickly.",
      image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Quiz Generation",
      description: "Test your knowledge with AI-generated quizzes tailored to your study materials.",
      image: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&q=80"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Relevant Study Links",
      description: "Discover curated resources and links to deepen your understanding of topics.",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80"
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Task & Calendar",
      description: "Organize your study schedule with built-in task tracking and reminders.",
      image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
      {/* Sophisticated gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/50 via-slate-950 to-fuchsia-950/50" />
      
      {/* Mesh gradient effect */}
      <div 
        className="fixed inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.15), transparent 50%)`
        }}
      />

      {/* Animated grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />

      {/* Floating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 -left-20 w-96 h-96 bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.05}px)` }}
        />
        <div 
          className="absolute top-1/3 -right-20 w-96 h-96 bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ transform: `translate(${-scrollY * 0.1}px, ${scrollY * 0.08}px)`, animationDelay: '2s' }}
        />
        <div 
          className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ transform: `translate(-50%, ${-scrollY * 0.05}px)`, animationDelay: '4s' }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 container mx-auto px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold">AI Study Buddy</span>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-violet-500/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8 border border-violet-500/20">
                <Star className="w-4 h-4 text-violet-400 fill-violet-400" />
                <span className="text-sm font-medium text-violet-300">Powered by Advanced AI Technology</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[0.9]">
                <span className="block text-white">AI Study</span>
                <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">Buddy</span>
              </h1>
              
              <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-xl">
                Your personal AI-powered learning assistant. Upload materials, ask questions, and master your coursework with intelligent study tools designed for modern students.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button 
                  onClick={() => navigate("/chat")}
                  className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold text-lg shadow-2xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                
               
              </div>

              <div className="flex items-center gap-8 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-violet-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-violet-400" />
                  <span>Free forever</span>
                </div>
              </div>
            </div>

            <div className="relative lg:block hidden">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80" 
                  alt="AI Technology"
                  className="rounded-2xl shadow-2xl border border-white/10"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-fuchsia-600/20 rounded-2xl" />
                
                {/* Floating card 1 */}
                <div className="absolute -left-8 top-1/4 bg-slate-900/90 backdrop-blur-xl rounded-xl p-4 border border-white/10 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                      <Brain className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">AI Analysis</div>
                      <div className="text-xs text-slate-400">Processing...</div>
                    </div>
                  </div>
                </div>

                {/* Floating card 2 */}
                <div className="absolute -right-8 bottom-1/4 bg-slate-900/90 backdrop-blur-xl rounded-xl p-4 border border-white/10 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">98% Accurate</div>
                      <div className="text-xs text-slate-400">Results ready</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 container mx-auto px-6 py-32">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-violet-500/20">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-300">Powerful Features</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Everything You Need to <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Excel</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Intelligent tools designed to transform how you learn and retain information
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative bg-slate-900/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-violet-500/50 transition-all duration-500 hover:transform hover:scale-[1.02]"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg">
                  {feature.icon}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/0 to-fuchsia-600/0 group-hover:from-violet-600/5 group-hover:to-fuchsia-600/5 transition-all duration-500 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 container mx-auto px-6 py-32">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-violet-900/30 to-fuchsia-900/30 backdrop-blur-2xl rounded-3xl p-12 md:p-16 border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
            
            <div className="relative z-10 grid md:grid-cols-3 gap-12 text-center">
              <div>
                <div className="text-6xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-3">10x</div>
                <div className="text-lg text-slate-300 font-medium">Faster Learning</div>
                <div className="text-sm text-slate-500 mt-2">Study more efficiently</div>
              </div>
              <div>
                <div className="text-6xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent mb-3">24/7</div>
                <div className="text-lg text-slate-300 font-medium">AI Assistance</div>
                <div className="text-sm text-slate-500 mt-2">Always available to help</div>
              </div>
              <div>
                <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent mb-3">100%</div>
                <div className="text-lg text-slate-300 font-medium">Context-Aware</div>
                <div className="text-sm text-slate-500 mt-2">Personalized responses</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80" 
                alt="Students studying"
                className="w-full h-48 object-cover rounded-xl mb-6"
              />
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-300 mb-4 leading-relaxed">
                "AI Study Buddy has completely transformed how I prepare for exams. The AI-generated quizzes are incredibly helpful!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full" />
                <div>
                  <div className="font-semibold text-white">Sarah Johnson</div>
                  <div className="text-sm text-slate-400">Medical Student</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80" 
                alt="Study group"
                className="w-full h-48 object-cover rounded-xl mb-6"
              />
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-300 mb-4 leading-relaxed">
                "The document summarization feature saves me hours every week. Best study tool I've ever used!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-purple-500 rounded-full" />
                <div>
                  <div className="font-semibold text-white">Michael Chen</div>
                  <div className="text-sm text-slate-400">Engineering Student</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 container mx-auto px-6 py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-violet-900/50 to-fuchsia-900/50 backdrop-blur-2xl rounded-3xl p-16 border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(139,92,246,0.1),transparent_50%)]" />
            
            <div className="relative z-10">
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                Ready to Study <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Smarter?</span>
              </h2>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                Join thousands of students who are already transforming their learning experience with AI-powered study tools
              </p>
              <button 
                onClick={() => navigate("/chat")}
                className="group relative px-10 py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-xl shadow-2xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Start Learning Now
                  <Zap className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <p className="text-sm text-slate-400 mt-6">No credit card required • Free forever • Cancel anytime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/5">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">AI Study Buddy</span>
            </div>
            <div className="text-slate-400 text-sm text-center">
              © 2025 AI Study Buddy. Powered by advanced AI and cloud technology.
            </div>
            <div className="flex gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}