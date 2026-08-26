import React from "react";
import { Link } from "react-router-dom";

const HeroSection = ({ settings = {} }) => {
  const {
    title = "Welcome to Etimad Mart",
    subtitle = "Discover the best deals today",
    image = "/banner.jpg",
    ctaText = "Shop Now",
    ctaLink = "/shop",
    align = "center", // left | center | right
  } = settings;

  const alignment =
    align === "left" ? "items-center text-left" : align === "right" ? "items-center text-right" : "items-center text-center";
  const justify = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";

  return (
    <section className="w-full">
      <div className="relative w-full overflow-hidden rounded-md">
        <img src={image} alt={title} className="w-full h-[240px] md:h-[380px] object-cover" loading="eager" />
        <div className={`absolute inset-0 bg-black/40 flex ${alignment} ${justify} p-4 md:p-8`}>
          <div className="max-w-3xl">
            <h2 className="text-white text-2xl md:text-4xl font-extrabold mb-2 md:mb-3">{title}</h2>
            {subtitle && <p className="text-white/90 text-sm md:text-base mb-3 md:mb-5">{subtitle}</p>}
            {ctaText && (
              <Link
                to={ctaLink}
                className="inline-block bg-primary text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full no-underline hover:bg-secondary transition-colors"
              >
                {ctaText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
