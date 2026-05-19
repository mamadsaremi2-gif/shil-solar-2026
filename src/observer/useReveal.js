import { useInView }
from "react-intersection-observer";

export function useReveal() {

  const {
    ref,
    inView,
  } = useInView({
    threshold: 0.12,
    triggerOnce: true,
  });

  return {
    ref,
    inView,
  };
}
