"use client";

import { useEffect } from "react";

/**
 * Hard-lock document scroll for iOS Safari (CSS alone does not kill rubber-banding).
 * While locked: fixed body + non-passive touchmove preventDefault.
 * Scrollable descendants marked with `[data-scroll-lock-ignore]` may pan, but
 * bounce is blocked at their scroll edges.
 */
export function useLockBodyScroll(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    const scrollY = window.scrollY;
    const html = document.documentElement;
    const { body } = document;

    const prevHtml = {
      overflow: html.style.overflow,
      height: html.style.height,
      overscrollBehavior: html.style.overscrollBehavior,
    };
    const prevBody = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      height: body.style.height,
      touchAction: body.style.touchAction,
      overscrollBehavior: body.style.overscrollBehavior,
    };

    html.style.overflow = "hidden";
    html.style.height = "100%";
    html.style.overscrollBehavior = "none";

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.height = "100%";
    body.style.touchAction = "none";
    body.style.overscrollBehavior = "none";

    let startY = 0;
    let startX = 0;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      startY = event.touches[0].clientY;
      startX = event.touches[0].clientX;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;

      const target = event.target;
      if (!(target instanceof Element)) {
        event.preventDefault();
        return;
      }

      const scroller = target.closest("[data-scroll-lock-ignore]");
      if (!(scroller instanceof HTMLElement)) {
        event.preventDefault();
        return;
      }

      const dy = event.touches[0].clientY - startY;
      const dx = event.touches[0].clientX - startX;
      const {
        scrollTop,
        scrollHeight,
        clientHeight,
        scrollLeft,
        scrollWidth,
        clientWidth,
      } = scroller;

      const canScrollY = scrollHeight > clientHeight + 1;
      const canScrollX = scrollWidth > clientWidth + 1;

      if (!canScrollY && !canScrollX) {
        event.preventDefault();
        return;
      }

      // Prefer the dominant axis for edge clamping.
      if (canScrollY && Math.abs(dy) >= Math.abs(dx)) {
        const atTop = scrollTop <= 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
        // dy > 0 = finger moving down = trying to scroll content up / pull past top
        if ((atTop && dy > 0) || (atBottom && dy < 0)) {
          event.preventDefault();
        }
        return;
      }

      if (canScrollX) {
        const atLeft = scrollLeft <= 0;
        const atRight = scrollLeft + clientWidth >= scrollWidth - 1;
        if ((atLeft && dx > 0) || (atRight && dx < 0)) {
          event.preventDefault();
        }
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    // Non-passive is required for preventDefault to stop Safari rubber-banding.
    document.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);

      html.style.overflow = prevHtml.overflow;
      html.style.height = prevHtml.height;
      html.style.overscrollBehavior = prevHtml.overscrollBehavior;

      body.style.overflow = prevBody.overflow;
      body.style.position = prevBody.position;
      body.style.top = prevBody.top;
      body.style.left = prevBody.left;
      body.style.right = prevBody.right;
      body.style.width = prevBody.width;
      body.style.height = prevBody.height;
      body.style.touchAction = prevBody.touchAction;
      body.style.overscrollBehavior = prevBody.overscrollBehavior;

      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
