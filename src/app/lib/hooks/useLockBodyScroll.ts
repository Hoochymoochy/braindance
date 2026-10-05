"use client";

import { useEffect } from "react";

type LockOptions = {
  /** CSS selector for elements that may still scroll while the document is locked. */
  allowSelector?: string;
};

/**
 * Reduce iOS Safari rubber-banding on stream pages without breaking mobile layout.
 * Avoids position:fixed on html/body (that can force a desktop layout viewport on iOS).
 */
export function useLockBodyScroll(
  locked: boolean,
  options: LockOptions = {}
): void {
  const allowSelector = options.allowSelector ?? "[data-scroll-lock-ignore]";

  useEffect(() => {
    if (!locked) return;

    const html = document.documentElement;
    const { body } = document;

    const prevHtmlOverflow = html.style.overflow;
    const prevHtmlOverscroll = html.style.overscrollBehavior;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    const prevBodyTouchAction = body.style.touchAction;

    html.classList.add("scroll-locked");
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.touchAction = "manipulation";

    let startY = 0;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      startY = event.touches[0].clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;

      const target = event.target;
      if (!(target instanceof Element)) {
        event.preventDefault();
        return;
      }
      if (target.closest("iframe")) return;

      const scroller = target.closest(allowSelector);
      if (!(scroller instanceof HTMLElement)) {
        // No nested scroller: block document drag (kills most rubber-banding).
        event.preventDefault();
        return;
      }

      const dy = event.touches[0].clientY - startY;
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      const canScrollY = scrollHeight > clientHeight + 1;
      if (!canScrollY) {
        event.preventDefault();
        return;
      }
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
      if ((atTop && dy > 0) || (atBottom && dy < 0)) {
        event.preventDefault();
      }
    };

    document.addEventListener("touchstart", onTouchStart, {
      passive: true,
      capture: true,
    });
    document.addEventListener("touchmove", onTouchMove, {
      passive: false,
      capture: true,
    });

    return () => {
      document.removeEventListener("touchstart", onTouchStart, true);
      document.removeEventListener("touchmove", onTouchMove, true);

      html.classList.remove("scroll-locked");
      html.style.overflow = prevHtmlOverflow;
      html.style.overscrollBehavior = prevHtmlOverscroll;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
      body.style.touchAction = prevBodyTouchAction;
    };
  }, [locked, allowSelector]);
}
