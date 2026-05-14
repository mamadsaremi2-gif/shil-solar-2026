import { useInView } from
  "react-intersection-observer";

export function useReveal() {

  const {
    ref,
    inView,
  } = useInView({
    triggerOnce: true,
    threshold: 0.12,
  });

  return {
    ref,
    inView,
  };
}
