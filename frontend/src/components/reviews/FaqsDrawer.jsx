import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AiOutlineClose } from "react-icons/ai";

const FaqsDrawer = ({ open, onClose, faqs = [] }) => {
  const validFaqs = Array.isArray(faqs)
    ? faqs.filter((f) => f && f.question && f.answer)
    : [];

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
              className="relative z-[10002] w-full max-w-3xl bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col max-h-[88vh]"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b bg-secondary">
                <h2></h2>
                <h3 className="text-xl font-semibold  text-center text-primary">FAQs</h3>
                <button aria-label="Close" onClick={onClose} className="p-2 rounded hover:bg-gray-100">
                  <AiOutlineClose className="w-6 h-6" />
                </button>
              </div>

              <div className="py-3 px-4 md:px-6 overflow-y-auto">
                {validFaqs.length === 0 ? (
                  <div className="text-gray-500">No FAQs available.</div>
                ) : (
                  <div className="divide-y divide-gray-200 font-space border border-gray-200 rounded-md overflow-hidden">
                    {validFaqs.map((faq, idx) => (
                      <AccordionItem key={idx} question={faq.question} answer={faq.answer} />)
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const AccordionItem = ({ question, answer }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left px-4 py-3 hover:bg-gray-50"
      >
        <span className="font-semibold text-primary">{question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className="ml-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="px-4 pb-4 text-secondary overflow-hidden"
          >
            <p className="leading-relaxed whitespace-pre-line">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FaqsDrawer;
