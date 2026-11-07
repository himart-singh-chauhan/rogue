import { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ScrollReveal = ({
  children,
  baseOpacity = 0,
  blurStrength = 10,
  stagger = 0.05,
  duration = 1,
  yOffset = 20,
  containerClassName = '',
}) => {
  const containerRef = useRef(null);

  const words = useMemo(() => {
    if (typeof children !== 'string') return null;
    return children.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return word;
      return (
        <span className="reveal-word" key={index} style={{ display: 'inline-block', willChange: 'opacity, filter, transform' }}>
          {word}
        </span>
      );
    });
  }, [children]);

  const hasPlayed = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const targets = el.querySelectorAll('.reveal-word').length > 0 
      ? el.querySelectorAll('.reveal-word') 
      : [el];

    if (hasPlayed.current) {
      gsap.set(targets, { opacity: 1, filter: 'blur(0px)', y: 0 });
      return;
    }

    gsap.set(targets, { 
      opacity: baseOpacity, 
      filter: `blur(${blurStrength}px)`,
      y: yOffset
    });

    const anim = gsap.to(targets, {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      duration: duration,
      stagger: stagger,
      ease: 'power3.out',
      // Drop the compositor hints once the reveal is done so idle pages stay light
      onComplete: () => gsap.set(targets, { clearProps: 'filter,willChange' }),
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
        toggleActions: 'play none none none',
        onEnter: () => {
          hasPlayed.current = true;
        }
      }
    });

    return () => {
      if (anim.scrollTrigger) anim.scrollTrigger.kill();
      anim.kill();
    };
  }, [baseOpacity, blurStrength, stagger, duration, yOffset]);

  return (
    <span 
      ref={containerRef} 
      className={containerClassName}
      style={{ display: 'inline-block', width: '100%' }}
    >
      {words || children}
    </span>
  );
};

export default ScrollReveal;
