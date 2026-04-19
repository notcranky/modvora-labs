'use client'

import { motion } from "framer-motion";

export default function Home() {
  return (
    <motion.main
      className="min-h-screen bg-black text-white px-6 py-12 sm:px-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto flex justify-between items-center mb-12"
      >
        <h1 className="text-5xl font-extrabold tracking-wide text-purple-600">Modvora Labs</h1>
        <nav className="space-x-6">
          <a href="#" className="text-gray-400 hover:text-purple-500 transition">
            Home
          </a>
          <a href="#" className="text-gray-400 hover:text-purple-500 transition">
            Community
          </a>
          <a href="#" className="text-gray-400 hover:text-purple-500 transition">
            About
          </a>
        </nav>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-4xl mx-auto bg-gray-900 rounded-lg p-10 shadow-lg"
      >
        <h2 className="text-3xl font-semibold mb-6 text-purple-400">Welcome to Modvora Labs</h2>
        <p className="text-lg text-gray-300 leading-relaxed mb-6">
          Journal your car builds, share your modifications, and connect with a community who shares your passion.
        </p>
        <button className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-white font-semibold">
          Get Started
        </button>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-12"
      >
        {[
          { title: "Build Logs", desc: "Track your progress with detailed logs" },
          { title: "Community", desc: "Explore and share builds with others" },
          { title: "Resources", desc: "Access guides, tips, and parts info" },
        ].map(({ title, desc }) => (
          <div key={title} className="bg-gray-900 rounded-xl p-6 shadow-lg hover:shadow-purple-600 transition">
            <h3 className="text-xl font-semibold mb-2 text-purple-300">{title}</h3>
            <p className="text-gray-400">{desc}</p>
          </div>
        ))}
      </motion.section>
    </motion.main>
  );
}
