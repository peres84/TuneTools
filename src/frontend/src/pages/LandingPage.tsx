import { Link } from 'react-router-dom'
import { useState } from 'react'
import logoDisk from '../assets/logo-disk.png'

export function LandingPage() {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: '1. Your Context',
      description: 'We gather your news preferences, weather, and calendar events',
      icon: '📊',
    },
    {
      title: '2. AI Analysis',
      description: 'Our LLM analyzes your data and creates custom lyrics and genre tags',
      icon: '🤖',
    },
    {
      title: '3. Music Generation',
      description: 'YuE model generates your unique 1-minute song via RunPod',
      icon: '🎵',
    },
    {
      title: '4. Album Creation',
      description: 'Songs are organized into weekly albums with vinyl disk artwork',
      icon: '💿',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-brand-dark dark:to-gray-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo and Title */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <img
              src={logoDisk}
              alt="TuneTools Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 animate-[spin_8s_linear_infinite]"
            />
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-brand-primary text-center sm:text-left">
              TuneTools
            </h1>
          </div>

          {/* Tagline */}
          <div className="mb-6">
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-700 dark:text-gray-300 mb-4 font-semibold px-4">
              Your Daily Song, Generated from Your Life
            </p>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
            Transform your daily context—news, weather, and calendar events—into personalized AI-generated songs.
            Every day is unique. Your soundtrack should be too.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4">
            <Link
              to="/signup"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-brand-primary text-white rounded-lg font-semibold text-base sm:text-lg hover:bg-opacity-90 active:scale-95 transition-all shadow-lg text-center touch-manipulation"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white dark:bg-gray-800 text-brand-primary dark:text-brand-secondary border-2 border-brand-primary dark:border-brand-secondary rounded-lg font-semibold text-base sm:text-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all shadow-lg text-center touch-manipulation"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works - Animated Demo Section */}
      <section className="container mx-auto px-4 py-16 bg-white dark:bg-gray-800 rounded-3xl shadow-xl mb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
            From your daily context to a personalized song in minutes
          </p>

          {/* Animated Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl transition-all cursor-pointer ${
                  currentStep === index
                    ? 'bg-brand-primary text-white scale-105 shadow-xl'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => setCurrentStep(index)}
                onMouseEnter={() => setCurrentStep(index)}
              >
                <div className="text-4xl mb-3">{step.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className={`text-sm ${currentStep === index ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-8">
            <div
              className="bg-brand-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Why TuneTools?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-2xl font-semibold text-brand-primary mb-3">Context-Aware</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Songs generated from your real-world data: news preferences, weather conditions, and calendar activities
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-2xl font-semibold text-brand-secondary mb-3">AI-Powered</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Advanced YuE music generation with multi-stage processing for high-quality audio
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">💿</div>
              <h3 className="text-2xl font-semibold text-brand-accent mb-3">Weekly Albums</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Organize your songs into beautiful weekly albums with custom vinyl disk artwork
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-2xl font-semibold text-brand-primary mb-3">Unique Artwork</h3>
              <p className="text-gray-600 dark:text-gray-400">
                AI-generated album covers transformed into vinyl disk designs for authentic music aesthetics
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-2xl font-semibold text-brand-secondary mb-3">Shareable</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Share your unique songs on social media with beautiful previews and Open Graph tags
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-2xl font-semibold text-brand-accent mb-3">Responsive</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Works seamlessly on desktop, tablet, and mobile devices with adaptive design
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 mb-16">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-brand-primary to-brand-secondary rounded-3xl p-12 shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Create Your Daily Song?
          </h2>
          <p className="text-xl text-white mb-8 opacity-90">
            Join TuneTools today and turn your life into music
          </p>
          <Link
            to="/signup"
            className="inline-block px-10 py-4 bg-white text-brand-primary rounded-lg font-bold text-lg hover:bg-gray-100 hover:scale-105 transition-all shadow-lg"
          >
            Start Generating Now
          </Link>
        </div>
      </section>
    </div>
  )
}