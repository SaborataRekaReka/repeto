FROM public.ecr.aws/docker/library/node:20-alpine AS build
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM public.ecr.aws/docker/library/node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3300

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.js ./next.config.js

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app/.next
USER appuser

EXPOSE 3300

CMD ["npm", "run", "start", "--", "-p", "3300"]
