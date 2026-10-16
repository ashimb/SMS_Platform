/**
 * Zod runs "jitless": by default Zod v4 probes `new Function("")` to JIT-compile object parsers.
 * Our CSP has no 'unsafe-eval', so the probe is blocked (and logged as a CSP violation). Jitless
 * parsing is plenty fast for forms and API responses. Import before any schema is parsed.
 */
import { z } from "zod";

z.config({ jitless: true });
