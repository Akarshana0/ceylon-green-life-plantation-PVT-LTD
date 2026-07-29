import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-forest-green-900">
      {/* Background Image */}
      <Image
        src="/assets/bg.jpg"
        alt="Ceylon Green Life Plantation"
        fill
        className="absolute z-0 object-cover opacity-60"
        priority
      />

      {/* Glassmorphism Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 m-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-8 flex flex-col items-center">
          <Image 
            src="/assets/logo.png"
            alt="Logo"
            width={120}
            height={120}
            className="mb-4 drop-shadow-md"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Ceylon Green Life</h1>
          <p className="text-gold-400">Employee Management System</p>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Email</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
              placeholder="admin@ceylongreenlife.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-forest-green-600 to-forest-green-500 hover:from-forest-green-500 hover:to-forest-green-400 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.4)] transform transition hover:-translate-y-0.5 active:translate-y-0"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
