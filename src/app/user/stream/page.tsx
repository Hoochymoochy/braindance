import { Play, Users, Globe, Share, Heart, MessageSquare } from "lucide-react"
import Image from "next/image"

export default function BraindanceUserStream() {
  return (
    <div className="min-h-screen bg-[#0a0014] text-white font-sans">
      <div className="container mx-auto p-4">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 text-transparent bg-clip-text">
              BRAINDANCE
            </h1>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-purple-900/40 hover:bg-purple-800/60 rounded-md text-sm font-medium border border-purple-500/50">
                Sign In
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-md text-sm font-medium hover:from-purple-500 hover:to-pink-500">
                Join Now
              </button>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Live Stream */}
          <div className="lg:col-span-2">
            {/* Live Stream Player */}
            <div className="relative rounded-lg overflow-hidden border border-purple-900/50 bg-black shadow-[0_0_15px_rgba(168,85,247,0.15)]">
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
                  <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                    <Users size={14} />
                    <span className="text-xs">1.2K</span>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-purple-900/70 transition-colors">
                    <Heart size={18} className="text-pink-400" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-purple-900/70 transition-colors">
                    <MessageSquare size={18} className="text-purple-400" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-purple-900/70 transition-colors">
                    <Share size={18} className="text-blue-400" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h2 className="text-xl font-bold">DJ Neon Pulse - Live from Club Vertex</h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                    <span className="text-xs font-bold">DJ</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Neon Pulse</p>
                    <p className="text-xs text-gray-400">Electronic / House</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div>
            {/* Top Stats */}
            <div className="rounded-lg border border-purple-900/50 bg-black/60 p-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              <h3 className="text-lg font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                TOP STATS
              </h3>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-400">Current Viewers</p>
                  <p className="text-3xl font-bold text-purple-400">1,243</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Active City</p>
                  <p className="text-3xl font-bold text-pink-400">LA</p>
                </div>
              </div>
              <button className="w-full py-3 rounded-md bg-purple-900/40 border border-purple-500/50 hover:bg-purple-800/60 transition-colors flex items-center justify-center gap-2 group">
                <Globe size={18} className="text-purple-400 group-hover:text-purple-300" />
                <span className="font-medium">heatmap / 3D globe</span>
              </button>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="p-3 rounded-md bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30">
                  <p className="text-xs text-gray-400">PEAK VIEWERS</p>
                  <p className="text-xl font-bold text-pink-300">2,187</p>
                </div>
                <div className="p-3 rounded-md bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30">
                  <p className="text-xs text-gray-400">STREAM TIME</p>
                  <p className="text-xl font-bold text-purple-300">1:42:18</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Photo Gallery */}
        <div className="mt-6 rounded-lg border border-purple-900/50 bg-black/60 p-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Photos of the Night
            </h3>
            <span className="text-sm text-gray-400">23 photos</span>
          </div>

          {/* Photo Grid - Larger Photos */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square relative rounded-md overflow-hidden border border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]"
              >
                <Image
                  src={`/placeholder.svg?height=300&width=300&text=Photo${i + 1}`}
                  alt={`Gallery photo ${i + 1}`}
                  layout="fill"
                  className="object-cover hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end">
                  <div className="p-2 w-full">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">@user{i + 1}</span>
                      <Heart size={14} className="text-pink-400" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Venue Tags / Shop Section */}
        <div className="mt-6 rounded-lg border border-purple-900/50 bg-black/60 p-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="px-3 py-1 bg-purple-900/40 border border-purple-500/30 rounded-full text-sm hover:bg-purple-800/60 cursor-pointer transition-colors">
              #ClubVertex
            </span>
            <span className="px-3 py-1 bg-purple-900/40 border border-purple-500/30 rounded-full text-sm hover:bg-purple-800/60 cursor-pointer transition-colors">
              #NeonNights
            </span>
            <span className="px-3 py-1 bg-purple-900/40 border border-purple-500/30 rounded-full text-sm hover:bg-purple-800/60 cursor-pointer transition-colors">
              #DJNeonPulse
            </span>
            <span className="px-3 py-1 bg-purple-900/40 border border-purple-500/30 rounded-full text-sm hover:bg-purple-800/60 cursor-pointer transition-colors">
              #LiveMusic
            </span>
            <span className="px-3 py-1 bg-purple-900/40 border border-purple-500/30 rounded-full text-sm hover:bg-purple-800/60 cursor-pointer transition-colors">
              #LosAngeles
            </span>
          </div>

          <h3 className="text-lg font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            MERCH & TICKETS
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-md text-center hover:from-purple-800/60 hover:to-pink-800/60 cursor-pointer transition-all transform hover:scale-105">
              <p className="text-sm font-medium">Official Tee</p>
              <p className="text-xs text-gray-400 mt-1">$35.00</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-md text-center hover:from-purple-800/60 hover:to-pink-800/60 cursor-pointer transition-all transform hover:scale-105">
              <p className="text-sm font-medium">VIP Tickets</p>
              <p className="text-xs text-gray-400 mt-1">Next Event</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-md text-center hover:from-purple-800/60 hover:to-pink-800/60 cursor-pointer transition-all transform hover:scale-105">
              <p className="text-sm font-medium">Digital Album</p>
              <p className="text-xs text-gray-400 mt-1">$12.99</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-md text-center hover:from-purple-800/60 hover:to-pink-800/60 cursor-pointer transition-all transform hover:scale-105">
              <p className="text-sm font-medium">Drink Tokens</p>
              <p className="text-xs text-gray-400 mt-1">Club Specials</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
