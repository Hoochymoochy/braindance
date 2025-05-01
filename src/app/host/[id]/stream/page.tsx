import { Play, Users, Globe, X, Check, Share, Heart, MessageSquare } from "lucide-react"
import Image from "next/image"

export default function BraindanceMockup() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="container mx-auto p-4">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 text-transparent bg-clip-text">
              BRAINDANCE
            </h1>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-purple-900 hover:bg-purple-800 rounded-md text-sm font-medium border border-purple-500">
                Sign In
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-md text-sm font-medium hover:from-purple-500 hover:to-pink-500">
                Join Now
              </button>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Live Stream + Photo Review */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Live Stream Player */}
            <div className="relative rounded-lg overflow-hidden border border-gray-800 bg-gray-900">
              <div className="aspect-video relative">
                <Image
                  src="/placeholder.svg?height=720&width=1280"
                  alt="Live Stream"
                  layout="fill"
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play size={80} className="text-white opacity-50" />
                </div>
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-red-600 px-2 py-1 rounded-md">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    <span className="text-xs font-bold">LIVE</span>
                  </div>
                  <div className="bg-black/50 px-2 py-1 rounded-md flex items-center gap-1">
                    <Users size={14} />
                    <span className="text-xs">1.2K</span>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-purple-900">
                    <Heart size={16} />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-purple-900">
                    <MessageSquare size={16} />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-purple-900">
                    <Share size={16} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h2 className="text-xl font-bold">DJ Neon Pulse - Live from Club Vertex</h2>
                <p className="text-gray-400 text-sm mt-1">User View</p>
              </div>
            </div>

            {/* Photo Review Tool */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">Photo Review Tool</h3>
                <span className="text-sm text-gray-400">12 reviewed</span>
              </div>
              <div className="aspect-video relative rounded-md overflow-hidden mb-4">
                <Image
                  src="/placeholder.svg?height=400&width=600"
                  alt="Photo to review"
                  layout="fill"
                  className="object-cover"
                />
              </div>
              <div className="flex justify-center gap-6">
                <button className="w-12 h-12 rounded-full bg-red-900/50 border border-red-500 flex items-center justify-center hover:bg-red-800 transition-colors">
                  <X className="text-red-400" size={24} />
                </button>
                <button className="w-12 h-12 rounded-full bg-green-900/50 border border-green-500 flex items-center justify-center hover:bg-green-800 transition-colors">
                  <Check className="text-green-400" size={24} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Stats + Photo Gallery */}
          <div className="flex flex-col gap-4">
            {/* Top Stats */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <h3 className="text-lg font-bold mb-3">TOP STATS</h3>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-sm text-gray-400">Current Viewers</p>
                  <p className="text-2xl font-bold text-purple-400">1,243</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Active City</p>
                  <p className="text-2xl font-bold text-pink-400">LA</p>
                </div>
              </div>
              <button className="w-full py-2 rounded-md bg-purple-900/50 border border-purple-500 hover:bg-purple-800 transition-colors flex items-center justify-center gap-2">
                <Globe size={16} />
                <span>heatmap / 3D globe</span>
              </button>
            </div>

            {/* Photo Gallery */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 flex-grow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">Photos of the Night</h3>
                <span className="text-sm text-gray-400">23/50</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1 bg-gray-800 rounded-full mb-4">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  style={{ width: "46%" }}
                ></div>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="aspect-square relative rounded-sm overflow-hidden border border-red-500/50">
                    <Image
                      src={`/placeholder.svg?height=150&width=150&text=Photo${i + 1}`}
                      alt={`Gallery photo ${i + 1}`}
                      layout="fill"
                      className="object-cover hover:scale-110 transition-transform"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Venue Tags / Shop Section */}
        <div className="mt-4 rounded-lg border border-gray-800 bg-gray-800/50 p-4">
          <h3 className="text-lg font-bold mb-2">Venue Tags / Shop</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">#ClubVertex</span>
            <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">#NeonNights</span>
            <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">#DJNeonPulse</span>
            <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">#LiveMusic</span>
            <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">#LosAngeles</span>
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-3 bg-gray-700 rounded-md text-center">
              <p className="text-xs text-gray-400">MERCH</p>
              <p className="text-sm">Shop Collection</p>
            </div>
            <div className="p-3 bg-gray-700 rounded-md text-center">
              <p className="text-xs text-gray-400">TICKETS</p>
              <p className="text-sm">Upcoming Events</p>
            </div>
            <div className="p-3 bg-gray-700 rounded-md text-center">
              <p className="text-xs text-gray-400">PARTNERS</p>
              <p className="text-sm">View Sponsors</p>
            </div>
            <div className="p-3 bg-gray-700 rounded-md text-center">
              <p className="text-xs text-gray-400">DRINKS</p>
              <p className="text-sm">Menu & Specials</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
