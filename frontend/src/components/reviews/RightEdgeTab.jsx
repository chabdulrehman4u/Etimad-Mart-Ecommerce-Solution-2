import React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { AiFillStar, AiOutlineFileText } from "react-icons/ai";
import { FaQuestion } from "react-icons/fa";

const RightEdgeTab = ({
  onClick,
  label = "Reviews",
  className = "",
  positionClass = "top-1/2",
  translateClass = "-translate-y-1/2",
  mobileVisible = false,
  style: styleOverride = {},
  icon: IconProp,
}) => {
  const DefaultIcon = React.useMemo(() => {
    if (/spec/i.test(label)) return AiOutlineFileText;
    if (/faq/i.test(label)) return FaQuestion;
    return AiFillStar;
  }, [label]);
  const Icon = IconProp || DefaultIcon;
  const node = (
    <button
      aria-label={`Open ${label.toLowerCase()}`}
      onClick={onClick}
      className={`${mobileVisible === false ? "hidden lg:block" : "block"} fixed right-1 md:right-0 ${positionClass} ${translateClass} z-[2000] pointer-events-auto ${className}`}
      style={{ writingMode: "vertical-rl", ...styleOverride }}
    >
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="px-1 py-2 rounded-l-lg bg-secondary text-sm text-primary font-semibold shadow-lg hover:brightness-110 flex items-center gap-1"
      >
        <Icon className="w-3 h-3" />
        <span className="font-space">{label}</span>
      </motion.div>
    </button>
  );
  const canPortal = typeof window !== "undefined" && typeof document !== "undefined" && document.body;
  return canPortal ? createPortal(node, document.body) : node;
};

export default RightEdgeTab;
