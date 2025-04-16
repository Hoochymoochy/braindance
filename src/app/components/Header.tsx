export default function Header() {
  return (
    <header className="w-full py-4 px-6 flex justify-between items-center bg-black border-b border-white/10">
      <h1 className="text-2xl font-bold text-gradient">Braindance</h1>
      <nav>
        <ul className="flex gap-6 text-sm uppercase tracking-wide">
          <li>
            <a href="#" className="hover:text-pink-400">
              Home
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-pink-400">
              Events
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-pink-400">
              Lore
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
