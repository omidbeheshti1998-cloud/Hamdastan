FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
# اسکریپت‌های نصب اینجا اجرا نمی‌شوند: postinstall پروژه `prisma generate` است و
# در این stage فقط package.json کپی شده، پس schema وجود ندارد. کلاینت در stage
# بعدی ساخته می‌شود، جایی که کل سورس هست.
RUN npm ci --ignore-scripts

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# خروجی generate در lib/generated است که نه در گیت است و نه در context ایمیج،
# پس باید همین‌جا ساخته شود. به دیتابیس وصل نمی‌شود.
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]