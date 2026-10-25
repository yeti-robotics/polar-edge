# Polar Edge

## About

Polar Edge is a scouting application for _FIRST_ Robotics Competition, built by Team 3506, YETI Robotics.

## Setup

### Prerequisites

Polar Edge requires Node.js 26, pnpm 12.15.0, and [Docker Desktop](https://www.docker.com/products/docker-desktop/) or [PostgreSQL](https://www.postgresql.org/download/). Use [nvm](https://github.com/nvm-sh/nvm) (macOS/Linux) or [fnm](https://github.com/Schniz/fnm) (Windows) to select the Node.js version in `.nvmrc`, then install pnpm with `npm install --global pnpm@12.15.0`.

### Local Setup

Setting up Polar Edge requires running a local instance of the database, and building the application. If Docker Desktop is installed and running, this will be handled automatically on dev startup. Otherwise, you will need to start the database manually.

In the root directory, run `pnpm install` to install the dependencies for the entire project. We recommend also installing the `turbo` CLI globally to make running commands easier. This can be done by running `pnpm install -g turbo`.

Two `.env.local` files are required for the project to build: one for the Next.js frontend, and one for the database package.

- `apps/web/.env.local`: This file is used to configure the Next.js frontend. It should be copied from `apps/web/.env.example`.
- `packages/database/.env.local`: This file is used to configure the database. It should be copied from `packages/database/.env.example`.

> If you are not using Docker Desktop, ensure that the `DATABASE_URL` in `packages/database/.env.local` points to your local PostgreSQL instance.

Once the dependencies are installed and `.env.local` files are configured, you can start the development server by running `turbo dev`.

## Documentation

Documentation for the project can be found on the [YETI Robotics' Wiki](https://wiki.yetirobotics.org/books/polar-edge-analytics).
