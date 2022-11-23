const { ref, onMounted, computed } = window.Vue;
let useJournalSetup;
(function () {
  const debounce = function (func, wait, options) {
    let lastArgs, lastThis, maxWait, result, timerId, lastCallTime;

    let lastInvokeTime = 0;
    let leading = false;
    let maxing = false;
    let trailing = true;

    // Bypass `requestAnimationFrame` by explicitly setting `wait=0`.
    const useRAF =
      !wait && wait !== 0 && typeof root.requestAnimationFrame === "function";

    if (typeof func !== "function") {
      throw new TypeError("Expected a function");
    }
    function isObject(value) {
      const type = typeof value;
      return value != null && (type === "object" || type === "function");
    }

    wait = +wait || 0;
    if (isObject(options)) {
      leading = !!options.leading;
      maxing = "maxWait" in options;
      maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : maxWait;
      trailing = "trailing" in options ? !!options.trailing : trailing;
    }

    function invokeFunc(time) {
      const args = lastArgs;
      const thisArg = lastThis;

      lastArgs = lastThis = undefined;
      lastInvokeTime = time;
      result = func.apply(thisArg, args);
      return result;
    }

    function startTimer(pendingFunc, wait) {
      if (useRAF) {
        root.cancelAnimationFrame(timerId);
        return root.requestAnimationFrame(pendingFunc);
      }
      return setTimeout(pendingFunc, wait);
    }

    function cancelTimer(id) {
      if (useRAF) {
        return root.cancelAnimationFrame(id);
      }
      clearTimeout(id);
    }

    function leadingEdge(time) {
      // Reset any `maxWait` timer.
      lastInvokeTime = time;
      // Start the timer for the trailing edge.
      timerId = startTimer(timerExpired, wait);
      // Invoke the leading edge.
      return leading ? invokeFunc(time) : result;
    }

    function remainingWait(time) {
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - lastInvokeTime;
      const timeWaiting = wait - timeSinceLastCall;

      return maxing
        ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
        : timeWaiting;
    }

    function shouldInvoke(time) {
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - lastInvokeTime;

      // Either this is the first call, activity has stopped and we're at the
      // trailing edge, the system time has gone backwards and we're treating
      // it as the trailing edge, or we've hit the `maxWait` limit.
      return (
        lastCallTime === undefined ||
        timeSinceLastCall >= wait ||
        timeSinceLastCall < 0 ||
        (maxing && timeSinceLastInvoke >= maxWait)
      );
    }

    function timerExpired() {
      const time = Date.now();
      if (shouldInvoke(time)) {
        return trailingEdge(time);
      }
      // Restart the timer.
      timerId = startTimer(timerExpired, remainingWait(time));
    }

    function trailingEdge(time) {
      timerId = undefined;

      // Only invoke if we have `lastArgs` which means `func` has been
      // debounced at least once.
      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
      lastArgs = lastThis = undefined;
      return result;
    }

    function cancel() {
      if (timerId !== undefined) {
        cancelTimer(timerId);
      }
      lastInvokeTime = 0;
      lastArgs = lastCallTime = lastThis = timerId = undefined;
    }

    function flush() {
      return timerId === undefined ? result : trailingEdge(Date.now());
    }

    function pending() {
      return timerId !== undefined;
    }

    function debounced(...args) {
      const time = Date.now();
      const isInvoking = shouldInvoke(time);

      lastArgs = args;
      lastThis = this;
      lastCallTime = time;

      if (isInvoking) {
        if (timerId === undefined) {
          return leadingEdge(lastCallTime);
        }
        if (maxing) {
          // Handle invocations in a tight loop.
          timerId = startTimer(timerExpired, wait);
          return invokeFunc(lastCallTime);
        }
      }
      if (timerId === undefined) {
        timerId = startTimer(timerExpired, wait);
      }
      return result;
    }
    debounced.cancel = cancel;
    debounced.flush = flush;
    debounced.pending = pending;
    return debounced;
  };
  var sgn = function (t, x) {
    let k = 1 / (1 - 2 * t);
    if (x <= t) return 0;
    else if (x >= 1 - t) return 1;
    else {
      return k * (x - t);
    }
  };
  window.useJournalSetup = useJournalSetup = () => {
    const navBarOffsetHeight = ref(0);
    const pageHeadOffsetHeight = ref(0);
    const windowScrollY = ref(0);
    const isDarkMode = ref(false)
    const isDrawerOpened = ref(false)
    const navBar = ref(null)
    const pageHead = ref(null)
    const navOpacity = computed(() =>
      sgn(
        0.0,
        Math.min(
          1,
          Math.max(
            0,
            windowScrollY.value /
              (pageHeadOffsetHeight.value - navBarOffsetHeight.value * 0.8)
          )
        )
      ) >= 1
        ? 1
        : 0
    );
    onMounted(() => {
      navBarOffsetHeight.value = navBar.value.offsetHeight;
      pageHeadOffsetHeight.value = pageHead.value.offsetHeight;
      window.addEventListener('resize', () => {
        navBarOffsetHeight.value = navBar.value.offsetHeight;
        pageHeadOffsetHeight.value = pageHead.value.offsetHeight;
      })
      window.addEventListener(
        "scroll",
        debounce(() => {
          windowScrollY.value = window.scrollY;
        }, 100, { maxWait: 100 }),
        false
      );
    })

    toggleDarkMode = function () {
      isDarkMode.value = !isDarkMode.value
      if (isDarkMode.value == true) {
        document.cookie = "night=1;path=/";
        document.body.classList.add("night");
      } else {
        document.cookie = "night=0;path=/";
        document.body.classList.remove("night");
      }
    };

    onMounted(() => {
      const night = document.cookie.replace(
        /(?:(?:^|.*;\s*)night\s*\=\s*([^;]*).*$)|^.*$/,
        "$1"
      );

      if (night == "") {
        if (
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
          toggleDarkMode();
        }
      } else {
        // If night is not empty
        if (night === "1") {
          toggleDarkMode();
        }
      }

      // 不一定能生效，但至少是个 debug 的方向
      document.querySelectorAll("table").forEach(function (elem) {
        elem.classList.add("table-striped");
        elem.classList.add("table");
        elem.classList.add("table-responsive");
        elem.classList.add("table-hover");
      });
    });
    return {
      navBarOffsetHeight,
      pageHeadOffsetHeight,
      windowScrollY,
      navOpacity,
      isDarkMode,
      isDrawerOpened,
      toggleDarkMode,
      navBar,
      pageHead,
    }
  };
})();
