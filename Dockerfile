FROM node:8-alpine

ENV NODE_ENV=production

WORKDIR /cpu_test

COPY server.js package.json ./

RUN npm install --production

EXPOSE 8888
USER node

CMD ["node", "--optimize_for_size", "--max_old_space_size=460", "--gc_interval=100", "--perf_basic_prof_only_functions", "--abort-on-uncaught-exception", "./server.js"]
