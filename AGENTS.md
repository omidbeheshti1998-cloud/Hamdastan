<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# RTL / فارسی

این اپلیکیشن راست‌به‌چپ و فارسی است. قبل از نوشتن هر UI، بخش ۰ راهنمای `docs/RTL.md` را بخوان.

قواعد کوتاه:
- Spacing و text alignment همیشه logical: `ms-`/`me-`/`ps-`/`pe-`/`text-start`/`text-end` — نه `ml-`/`mr-`/`pl-`/`pr-`/`text-left`/`text-right`.
- Positioning عنصرهای چسبیده به لبهٔ صفحه (sidebar، drawer) فیزیکی بماند: `left-*`/`right-*`.
- واریانت‌های `rtl:`/`ltr:` در Tailwind v4 داخلی‌اند؛ `tailwind.config.ts` نساز.
