import "./quote.css"
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getQuote } from "./firebase";

const Quote = () => {
  const [index, setIndex] = useState(0);
  const [texts, setTexts] = useState([]);
  const [direction, setDirection] = useState(1);
  const interval = 3000;

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const fetched = await getQuote();
        if (Array.isArray(fetched)) {
          setTexts(fetched);
        } else if (fetched) {
          setTexts([fetched]);
        }
      } catch (err) {
        console.error("Error fetching quotes:", err);
      }
    };
    fetchQuotes();
  }, []);

  useEffect(() => {
    if (texts.length === 0) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % texts.length);
    }, interval);
    return () => clearInterval(timer);
  }, [texts, interval]);

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
        {texts.length > 0 && (
          <motion.blockquote
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5 }}
          >
            {texts[index]?.quote}
            {texts[index]?.author && (
              <figcaption>— {texts[index].author}</figcaption>
            )}
          </motion.blockquote>
        )}
      </AnimatePresence>
    </figure>
  );
}

export default Quote;
