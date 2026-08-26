import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";

const NotFound = () => {
  const [animData, setAnimData] = useState(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // Mark NotFound active to allow other components (e.g., Navbar) to react
    document.documentElement.setAttribute('data-not-found', 'true');

    // Respect prefers-reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", onChange);

    // Fetch Lottie JSON from public
    fetch("/404.json")
      .then((r) => r.json())
      .then(setAnimData)
      .catch(() => setAnimData(null));

    return () => {
      mq.removeEventListener?.("change", onChange);
      document.documentElement.removeAttribute('data-not-found');
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center bg-gray-100 ">
      {/* Lottie animation or fallback heading */}
      {animData && !reduced ? (
        <Lottie
          animationData={animData}
          autoplay
          loop
          style={{ width: 320, height: 320 }}
        />)
        : (
        <motion.h1
          className="text-8xl font-bold text-primary"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          404
        </motion.h1>
      )}

      <motion.div
        className="mt-6"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Link to="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="bg-secondary text-primary px-6 py-2 -mt-4 rounded-full shadow-md"
          >
            Go Back Home
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
