FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Only the two PUBLIC values are baked in (build args). Everything secret or per-environment
# (DATA_SOURCE, SUPABASE_SERVICE_ROLE_KEY, RESEND_*, CRON_SECRET, JOBS_SECRET) is read when the
# container starts, from `docker run --env-file` (see .github/workflows/deploy.yaml).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]