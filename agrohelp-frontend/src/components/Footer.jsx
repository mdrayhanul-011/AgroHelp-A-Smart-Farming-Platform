export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-emerald-50 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h2 className="text-2xl font-bold">AgroHelp</h2>
          <p className="mt-3 text-emerald-100">Empowering farmers with modern solutions for a sustainable future.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2">
            <li><a href="/" className="hover:text-white transition">Home</a></li>
            <li><a href="/advisory" className="hover:text-white transition">Advisory</a></li>
            <li><a href="/insects" className="hover:text-white transition">Insect Detector</a></li>
            <li><a href="/login" className="hover:text-white transition">Login</a></li>
            <li><a href="/contact" className="hover:text-white transition">Contact</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">Follow Us</h3>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-white transition">Facebook</a>
            <a href="#" className="hover:text-white transition">Twitter</a>
            <a href="#" className="hover:text-white transition">LinkedIn</a>
            <a href="#" className="hover:text-white transition">GitHub</a>
          </div>
        </div>
      </div>
      <div className="border-t border-emerald-600 mt-8 pt-4 text-center text-emerald-200 text-sm">
        © {new Date().getFullYear()} AgroHelp. All Rights Reserved.
      </div>
    </footer>
  )
}
