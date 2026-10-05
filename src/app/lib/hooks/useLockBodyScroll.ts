"use client";

import { useEffect } from "react";

type LockOptions = {
  /** CSS selector for elements that may still scroll while the document is locked. */
  allowSelector?: string;
};

/**
 * iOS Safari rubber-band fix: lock html/body and cancel touchmove (non-passive).
 * Optional `allowSelector` lets nested scrollers pan without chaining bounce to the page.
 */
export function useLockBodyScroll(
  locked: boolean,
  options: LockOptions = {}
): void {
  const allowSelector = options.allowSelector ?? "[data-scroll-lock-ignore]";

  useEffect(() => {
    if (!locked) return;

    const scrollY = window.scrollY;
    const html = document.documentElement;
    const { body } = document;

    const prevHtmlClass = html.className;
    html.classList.add("scroll-locked");

    const prevHtml = {
      overflow: html.style.overflow,
      height: html.style.height,
      overscrollBehavior: html.style.overscrollBehavior,
      position: html.style.position,
      width: html.style.width,
      top: html.style.top,
      left: html.style.left,
      right: html.style.right,
      bottom: html.style.bottom,
    };
    const prevBody = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      bottom: body.style.bottom,
      width: body.style.width,
      height: body.style.height,
      touchAction: body.style.touchAction,
      overscrollBehavior: body.style.overscrollBehavior,
    };

    // html: clip only. body: fixed (Safari will bounce html if it's also a scroller).
    html.style.overflow = "hidden";
    html.style.height = "100%";
    html.style.overscrollBehavior = "none";

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.bottom = "0";
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

      // YouTube / embeds handle their own gestures.
      if (target.closest("iframe")) return;

      const scroller = target.closest(allowSelector);
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

      if (canScrollY && Math.abs(dy) >= Math.abs(dx)) {
        const atTop = scrollTop <= 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
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

      html.className = prevHtmlClass;

      html.style.overflow = prevHtml.overflow;
      html.style.height = prevHtml.height;
      html.style.overscrollBehavior = prevHtml.overscrollBehavior;
      html.style.position = prevHtml.position;
      html.style.width = prevHtml.width;
      html.style.top = prevHtml.top;
      html.style.left = prevHtml.left;
      html.style.right = prevHtml.right;
      html.style.bottom = prevHtml.bottom;

      body.style.overflow = prevBody.overflow;
      body.style.position = prevBody.position;
      body.style.top = prevBody.top;
      body.style.left = prevBody.left;
      body.style.right = prevBody.right;
      body.style.bottom = prevBody.bottom;
      body.style.width = prevBody.width;
      body.style.height = prevBody.height;
      body.style.touchAction = prevBody.touchAction;
      body.style.overscrollBehavior = prevBody.overscrollBehavior;

      window.scrollTo(0, scrollY);
    };
  }, [locked, allowSelector]);
}
