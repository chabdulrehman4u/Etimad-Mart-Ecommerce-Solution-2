import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AiOutlineClose } from "react-icons/ai";
import { replaceBulletsWithCheck } from "../../helpers/replaceBulletwithCheck";

const SpecificationsDrawer = ({ open, onClose, title = "Specifications", html = "" }) => {
  const processedHtml = useMemo(() => replaceBulletsWithCheck(html), [html]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[10000] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-[10001] flex items-center justify-center p-2 sm:p-4"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
          >
            <motion.div
              className="relative z-[10002] w-full max-w-5xl bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col max-h-[88vh]"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center bg-secondary justify-between p-4 border-b">
                <h2></h2>
                <h3 className="text-xl font-semibold">{title}</h3>
                <button aria-label="Close" onClick={onClose} className="p-2 rounded hover:bg-gray-100">
                  <AiOutlineClose className="w-6 h-6" />
                </button>
              </div>
              <div className="py-4 px-4 md:px-8 overflow-y-auto prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SpecificationsDrawer;
