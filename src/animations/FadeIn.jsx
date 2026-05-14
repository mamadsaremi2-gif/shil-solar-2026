import React from "react";
import { motion } from "framer-motion";

export default function FadeIn({
  children,
}) {

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 18,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
      }}
      viewport={{
        once: true,
      }}
    >

      {children}

    </motion.div>
  );
}
