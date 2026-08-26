import { useState } from "react";
import { toast } from "react-hot-toast";

import { useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signupAPI } from "../functions/auth";
import { setUser } from "../store/authSlice";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";

const Signup = () => {
  const dispatch = useDispatch();
  const navigateTo = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);

      const response = await signupAPI(formData);
      if (response?.success) {
        dispatch(setUser(response?.newUser));
        toast.success("Signup successful");
        navigateTo(from, { replace: true });
      } else {
        toast.error(response?.message || "Signup failed");
      }
    } catch (error) {
      console.error("Error during signup:", error?.response?.data?.message || error?.message);
      toast.error(error?.response?.data?.message || error?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-yellow-50 to-yellow-100 overflow-hidden">
      {/* Blurred, colored circles for e-commerce pattern */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400 opacity-30 rounded-full filter blur-3xl z-0"></div>
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-yellow-300 opacity-20 rounded-full filter blur-2xl z-0 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 opacity-20 rounded-full filter blur-2xl z-0"></div>
      <div className="absolute top-1/4 right-1/3 w-72 h-72 bg-yellow-400 opacity-20 rounded-full filter blur-2xl z-0"></div>
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-300 opacity-20 rounded-full filter blur-2xl z-0"></div>
      {/* Extra pattern: more circles and soft rectangles */}
      <div className="absolute top-10 right-1/4 w-40 h-40 bg-blue-200 opacity-30 rounded-full filter blur-2xl z-0"></div>
      <div className="absolute bottom-10 left-1/3 w-52 h-52 bg-yellow-200 opacity-20 rounded-full filter blur-2xl z-0"></div>
      <div className="absolute top-1/3 left-1/2 w-64 h-20 bg-blue-100 opacity-30 rounded-lg filter blur-xl rotate-12 z-0"></div>
      <div className="absolute bottom-1/3 right-1/2 w-72 h-16 bg-yellow-100 opacity-30 rounded-lg filter blur-xl -rotate-12 z-0"></div>
      {/* Centered form */}
      <div className="container mx-auto px-0 lg:px-4 py-0 lg:py-8 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-secondary bg-opacity-60 backdrop-blur-md p-6 shadow-2xl w-full max-w-md relative z-10"
        >
          <h2 className="text-primary font-bold text-center text-2xl md:text-3xl py-2">Sign Up</h2>

          <form className="pt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="grid">
              <label className="font-medium py-2 text-primary">Name *</label>
              <div className="bg-slate-100 p-2 rounded">
                <input
                  type="text"
                  placeholder="Enter your name"
                  name="name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full h-full rounded outline-none bg-transparent"
                />
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="grid">
              <label className="font-medium py-2 text-primary">Email *</label>
              <div className="bg-slate-100 p-2 rounded">
                <input
                  type="email"
                  placeholder="Enter email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-full outline-none rounded bg-transparent"
                />
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="grid">
              <label className="font-medium py-2 text-primary">Password *</label>
              <div className="bg-slate-100 p-2 rounded flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  name="password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-full outline-none bg-transparent"
                />
                <div
                  className="cursor-pointer text-xl ml-2"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="bg-primary/80 hover:bg-primary text-white px-6 py-2 w-full rounded transition-all mt-4"
            >
              {loading ? "Signing up..." : "Sign Up"}
            </motion.button>
          </form>

          <p className="my-5 text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary/80 hover:text-primary opacity-70 hover:opacity-90 hover:underline"
            >
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Signup;