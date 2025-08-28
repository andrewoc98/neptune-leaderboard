import "./quote.css"
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Quote ({quotes}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const interval = 3000;

  useEffect(() => {
    if (!quotes || quotes.length === 0) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % quotes.length);
    }, interval);
    return () => clearInterval(timer);
  }, [quotes, interval]);

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      position: "absolute"
    }),
    center: {
      x: 0,
      opacity: 1,
      position: "relative"
    },
    exit: (direction) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
      position: "absolute"
    })
  };

  return (
    <figure className="quote">
      <AnimatePresence custom={direction}>
        {quotes && quotes.length > 0 && (
          <motion.blockquote
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5 }}
          >
            {quotes[index]?.quote}
            {quotes[index]?.author && (
              <figcaption>— {quotes[index].author}</figcaption>
            )}
          </motion.blockquote>
        )}
      </AnimatePresence>
    </figure>
  );
}
