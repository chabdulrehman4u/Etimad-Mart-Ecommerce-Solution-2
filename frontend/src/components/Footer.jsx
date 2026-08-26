import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import { FaWhatsapp } from "react-icons/fa6";
import { MdLocationOn, MdMail } from "react-icons/md";
import { getFooter } from "../functions/footer";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

const socialIconVariants = {
  hover: {
    scale: 1.2,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
  tap: { scale: 0.9 },
};

const linkVariants = {
  hover: {
    x: 5,
    color: "#4F46E5", // Your main color
  },
};

// Helper to map icon string to component
const getSocialIcon = (icon) => {
  switch (icon?.toLowerCase()) {
    case "facebook":
      return (
        <FaFacebook
          className="text-white hover:text-secondary transition-colors"
          size={24}
        />
      );
    case "instagram":
      return (
        <FaInstagram
          className="transition-all duration-300 text-white hover:text-secondary"
          size={24}
        />
      );
    case "tiktok":
      return (
        <FaTiktok
          className="text-white hover:text-secondary transition-colors"
          size={24}
        />
      );
    case "twitter":
      return (
        <FaTwitter
          className="text-white hover:text-secondary transition-colors"
          size={24}
        />
      );
    case "linkedin":
      return (
        <FaLinkedin
          className="text-white hover:text-secondary transition-colors"
          size={24}
        />
      );
    case "whatsapp":
      return (
        <FaWhatsapp
          className="text-white hover:text-secondary transition-colors"
          size={24}
        />
      );
    case "youtube":
      return (
        <FaYoutube
          className="text-white hover:text-secondary transition-colors"
          size={24}
        />
      );
    default:
      return null;
  }
};

const Footer = () => {
  const [footerData, setFooterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);

  const fetchFooterData = async () => {
    try {
      const response = await getFooter();
      // Support both response.footer and response.data.footer
      const data = response?.footer || response?.data?.footer || response?.data;
      setFooterData(data);
    } catch (error) {
      setFooterData(null);
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFooterData();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsLargeScreen(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fallbacks
  const logoUrl = footerData?.logoUrl || "/f-logo.webp";
  const aboutText = footerData?.aboutText || "Shopping karain Etimad ke sath";
  // Ensure Contact Us is always included in quick links
  const defaultQuickLinks = [
    { label: "About Us", url: "/about" },
    { label: "Shop", url: "/shop" },
    { label: "Blogs", url: "/blogs" },
    { label: "Contact Us", url: "/contact-us" },
    { label: "Terms and Conditions", url: "/terms-and-conditions" },
    { label: "Privacy Policy", url: "/privacy-policy" },
    { label: "Shipping Policy", url: "/shipping-policy" },
    { label: "Return Policy", url: "/return-policy" },
  ];

  // Use backend data if available, otherwise use fallback
  const quickLinks = footerData?.quickLinks || defaultQuickLinks;

  // Ensure Contact Us is always present
  const hasContactUs = quickLinks.some(
    (link) => link.label === "Contact Us" || link.url === "/contact-us"
  );

  const finalQuickLinks = hasContactUs
    ? quickLinks
    : [...quickLinks, { label: "Contact Us", url: "/contact-us" }];
  const contactInfo = footerData?.contactInfo || {
    address: "Zahir Pir, Rahim Yar Khan",
    whatsapp: "+923071111832",
    phone: "03071111832",
    email: "info@etimadmart.com",
  };
  const socialLinks = footerData?.socialLinks || [
    { icon: "facebook", url: "https://www.facebook.com/EtimadMart/" },
    { icon: "instagram", url: "https://www.instagram.com/etimad_mart" },
    { icon: "tiktok", url: "https://www.tiktok.com/@etimad_mart" },
    { icon: "youtube", url: "https://www.youtube.com/channel/UCsvYjwsM1GtRe1aiSHwYGjQ" },
  ];
  const copyright = footerData?.copyright || "© 2025. All Rights Reserved.";

  if (loading) {
    return (
      <div className="bg-primary text-white py-6 px-4 md:pt-10 md:px-6 relative border-t-2 border-secondary text-center">
        <span>Loading footer...</span>
      </div>
    );
  }

  return (
    <>
      <div className="bg-primary text-white py-6 px-4 md:pt-10 md:px-6 relative border-t-2 border-secondary">
        {/* Container to center content */}
        <motion.div
          className="max-w-screen-xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          {/* Mobile: Stacked layout */}
          <div className="md:hidden flex flex-col space-y-8">
            {/* Logo and Description */}
            <motion.div className="text-center" variants={itemVariants}>
              <a href="/">
                <motion.img
                  src={logoUrl || "/f-logo.webp"}
                  alt="Logo"
                  className="bg-transparent mx-auto h-16 object-contain"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  width="160"
                  height="64"
                />
              </a>
              <motion.p
                className="text-secondary text-sm px-4 font-semibold"
                whileHover={{ scale: 1.02 }}
              >
                {aboutText}
              </motion.p>
            </motion.div>

            {/* Quick Links - Clean List Layout on Mobile */}
            <motion.div className="px-4" variants={itemVariants}>
              <motion.h3
                className="text-lg font-semibold mb-4 text-center text-secondary"
                whileHover={{ scale: 1.02 }}
              >
                Quick Links
              </motion.h3>
              <div className="flex flex-col space-y-2">
                {finalQuickLinks.map((link, idx) => (
                  <motion.a
                    key={link._id || link.url || idx}
                    href={link.url}
                    className="text-white hover:text-secondary text-sm font-medium no-underline text-center py-2 transition-colors duration-300 border-b border-white/10 hover:border-secondary/30"
                    variants={linkVariants}
                    whileHover="hover"
                    whileTap={{ scale: 0.98 }}
                  >
                    {link.label}
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div className="text-center" variants={itemVariants}>
              <motion.h3
                className="text-lg font-semibold mb-3 text-secondary"
                whileHover={{ scale: 1.02 }}
              >
                Contact Us
              </motion.h3>
              <div className="text-white space-y-3 text-sm">
                <motion.div
                  className="flex justify-center items-center space-x-2"
                  whileHover={{ x: 5 }}
                >
                  <MdLocationOn className="text-secondary" size={18} />
                  <span>{contactInfo.address}</span>
                </motion.div>
                <motion.div
                  className="flex justify-center items-center space-x-2"
                  whileHover={{ x: 5 }}
                >
                  <a
                    href={`https://wa.me/${contactInfo.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 no-underline text-white hover:text-white transition-colors"
                  >
                    <FaWhatsapp className="text-secondary" size={18} />
                    <span>{contactInfo.whatsapp}</span>
                  </a>
                </motion.div>
                <motion.div
                  className="flex justify-center items-center space-x-2"
                  whileHover={{ x: 5 }}
                >
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="flex items-center space-x-2 no-underline text-white transition-colors"
                  >
                    <MdMail className="text-secondary" size={18} />
                    <span>{contactInfo.email}</span>
                  </a>
                </motion.div>
              </div>
            </motion.div>

            {/* Social Media Links */}
            <motion.div className="text-center" variants={itemVariants}>
              <motion.h3
                className="text-lg font-semibold mb-3 text-secondary"
                whileHover={{ scale: 1.02 }}
              >
                Follow Us
              </motion.h3>
              <div className="flex justify-center space-x-5">
                {socialLinks.map((link, idx) => (
                  <motion.a
                    key={link._id || link.url || idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit our ${link.icon.charAt(0).toUpperCase() + link.icon.slice(1)} page`}
                    variants={socialIconVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    {getSocialIcon(link.icon)}
                  </motion.a>
                ))}
              </div>
              <span className="text-secondary font-semibold text-base">Our courier partners</span>
              <div className="mt-2 flex justify-center">
                <img
                  src="/courier-partners.webp"
                  alt="Our courier partners"
                  className="h-[120px] w-auto max-w-full object-contain"
                  width="550"
                  height="120"
                />
              </div>
              <div className="mt-4 flex flex-col items-center gap-2 w-full">
                <div className="w-full">
                  <img
                    src="/pms.webp"
                    alt="Our payment methods"
                    className="w-full h-auto object-contain"
                    width="300"
                    height="90"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* First Div: Image and Text */}
            <motion.div variants={itemVariants}>
              <a href="/">
                <motion.img
                  src={logoUrl || "/f-logo.webp"}
                  alt="Logo"
                  className="bg-transparent mx-auto h-20 md:h-28 lg:h-32 object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  width="224"
                  height="96"
                />
              </a>
              <motion.p
                className="text-secondary font-semibold text-base"
                whileHover={{ scale: 1.02 }}
              >
                {aboutText}
              </motion.p>
            </motion.div>

            {/* Second Div: Quick Links */}
            <motion.div variants={itemVariants}>
              <motion.h3
                className="text-2xl font-semibold mb-4 text-center md:text-start text-secondary"
                whileHover={{ scale: 1.02 }}
              >
                Quick Links
              </motion.h3>
              <ul className="text-white space-y-2 text-center md:text-start list-none">
                {finalQuickLinks.map((link, idx) => (
                  <motion.li
                    key={link._id || link.url || idx}
                    variants={linkVariants}
                    whileHover="hover"
                  >
                    <a
                      href={link.url}
                      className="text-gray-200 hover:text-white text-[1rem] md:text-xl font-medium no-underline transition-colors"
                    >
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Third Div: Contact Information and Social Links */}
            <motion.div
              className="flex flex-col justify-start"
              variants={itemVariants}
            >
              <motion.h3
                className="text-2xl text-center md:text-start font-semibold mb-4 text-secondary"
                whileHover={{ scale: 1.02 }}
              >
                Contact Information
              </motion.h3>
              <div className="text-white space-y-4 md:items-start">
                <motion.div
                  className="flex justify-center md:justify-start"
                  whileHover={{ x: 5 }}
                >
                  <span className="flex items-center space-x-2">
                    <MdLocationOn className="text-secondary" size={22} />
                    <span className="text-xs md:text-sm">
                      {contactInfo.address}
                    </span>
                  </span>
                </motion.div>
                <motion.div
                  className="flex justify-center md:justify-start items-center space-x-2"
                  whileHover={{ x: 5 }}
                >
                  <a
                    href={`https://wa.me/${contactInfo.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center no-underline space-x-2 hover:text-main transition-colors"
                  >
                    <FaWhatsapp className="text-secondary" size={22} />
                    <span className="text-gray-200 hover:text-white">
                      {contactInfo.whatsapp}
                    </span>
                  </a>
                </motion.div>
                <motion.div
                  className="flex justify-center md:justify-start items-center space-x-2"
                  whileHover={{ x: 5 }}
                >
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="flex items-center space-x-2 no-underline hover:text-main transition-colors"
                  >
                    <MdMail className="text-secondary" size={22} />
                    <span className="text-gray-200 hover:text-white">
                      {contactInfo.email}
                    </span>
                  </a>
                </motion.div>
              </div>
              <div className="mt-6 flex flex-col items-center md:items-start gap-2 w-full">
                {/* <span className="text-xl text-center md:text-start font-semibold text-secondary">
                  Payment Methods
                </span> */}
                <div className="w-full max-w-xs md:max-w-sm">
                  <img
                    src="/pms.webp"
                    alt="Our payment methods"
                    className="w-full h-auto object-contain"
                    width="300"
                    height="90"
                  />
                </div>
              </div>
            </motion.div>

            {/* Social Media Links */}
            <motion.div variants={itemVariants}>
              <motion.h3
                className="text-2xl text-center md:text-start font-semibold mb-4 text-secondary"
                whileHover={{ scale: 1.02 }}
              >
                Follow Us Online
              </motion.h3>
              <div className="flex justify-center md:justify-start space-x-5 mt-4">
                {socialLinks.map((link, idx) => (
                  <motion.a
                    key={link._id || link.url || idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit our ${link.icon.charAt(0).toUpperCase() + link.icon.slice(1)} page`}
                    variants={socialIconVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    {getSocialIcon(link.icon)}
                  </motion.a>
                ))}
              </div>
              <div className="mt-4 flex flex-col items-center md:items-start gap-2 w-full">
                <span className="text-2xl text-center md:text-start font-semibold mb-4 text-secondary">
                  Our Courier Partners
                </span>
                <div className="w-full max-w-xs md:max-w-sm">
                  <img
                    src="/courier-partners.webp"
                    alt="Our courier partners"
                    className="w-full h-auto object-contain"
                    width="300"
                    height="90"
                  />
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </div>
      {/* Copyright Section */}
      <motion.div
        className="text-secondary bg-primary text-center py-3 text-sm md:text-base border-t border-secondary"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p>{copyright}</p>
      </motion.div>
    </>
  );
};

export default Footer;
