# Changelog

## [1.4.2](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.4.1...basecamp-v1.4.2) (2026-06-07)


### Bug Fixes

* **basecamp:** end previous season and set new season dates ([#551](https://github.com/yeti-robotics/polar-edge/issues/551)) ([361725a](https://github.com/yeti-robotics/polar-edge/commit/361725a4d8e5cd351b5c0d9b5678b75d57eb1794))
* **basecamp:** lint errors ([#553](https://github.com/yeti-robotics/polar-edge/issues/553)) ([83cc544](https://github.com/yeti-robotics/polar-edge/commit/83cc544d14a80245de1c789c734c9bb4c2365e81))
* **basecamp:** remove flooring of hours ([#552](https://github.com/yeti-robotics/polar-edge/issues/552)) ([959efa8](https://github.com/yeti-robotics/polar-edge/commit/959efa86205f619133d1eb4eb69970c1d4231697))

## [1.4.1](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.4.0...basecamp-v1.4.1) (2026-05-02)


### Bug Fixes

* **basecamp:** add additional dates ([76d0be4](https://github.com/yeti-robotics/polar-edge/commit/76d0be466b22128f3e53d414b33b89a5715e74d3))
* **basecamp:** fix tests ([672b35a](https://github.com/yeti-robotics/polar-edge/commit/672b35ad832b76f0a252c3f523fa06b54efb3a7d))

## [1.4.0](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.3.2...basecamp-v1.4.0) (2026-04-06)


### Features

* **basecamp:** Refactor leaderboard to show user rank outside top 5 ([#469](https://github.com/yeti-robotics/polar-edge/issues/469)) ([d6ea46f](https://github.com/yeti-robotics/polar-edge/commit/d6ea46f74b87d01120c8ef5acbfe1ad491227b90))

## [1.3.2](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.3.1...basecamp-v1.3.2) (2026-03-25)


### Bug Fixes

* add competiion exclusion ([77f5b5d](https://github.com/yeti-robotics/polar-edge/commit/77f5b5d53edfea64d6549782f0374ae0c1cb92ad))

## [1.3.1](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.3.0...basecamp-v1.3.1) (2026-03-10)


### Bug Fixes

* **basecamp:** add exclusion for cab ([f065093](https://github.com/yeti-robotics/polar-edge/commit/f0650933f8bf6c6feef53fd427766abcc0a6b1ba))

## [1.3.0](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.2.0...basecamp-v1.3.0) (2026-03-05)


### Features

* **basecamp:** implement dynamic logging levels based on environment variable ([77f6236](https://github.com/yeti-robotics/polar-edge/commit/77f62368ae4139787bda622fdb1b680eea9b1d44))


### Bug Fixes

* **basecamp:** update handbook command to use deferReply and editReply ([57120d1](https://github.com/yeti-robotics/polar-edge/commit/57120d1a2ad2a9ccc52c8a7eebe8ef3f8d301595))

## [1.2.0](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.1.4...basecamp-v1.2.0) (2026-03-03)


### Features

* **basecamp:** security hardening for 2FA and basecamp-fe auth ([#471](https://github.com/yeti-robotics/polar-edge/issues/471)) ([fa717f9](https://github.com/yeti-robotics/polar-edge/commit/fa717f9a06ebfa0d34d1b065954723cccde84e93))


### Bug Fixes

* **basecamp:** attendance/outreach commands error handling and add logging utilities ([#473](https://github.com/yeti-robotics/polar-edge/issues/473)) ([0224d9d](https://github.com/yeti-robotics/polar-edge/commit/0224d9dc1d574ef51801773f6b9149fe3f5026bf))

## [1.1.4](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.1.3...basecamp-v1.1.4) (2026-03-01)


### Performance Improvements

* **basecamp:** integrate cache manager for sheet service and update dependencies ([e669c48](https://github.com/yeti-robotics/polar-edge/commit/e669c487ec48b23704217b230a9af3ba9251fbb5))

## [1.1.3](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.1.2...basecamp-v1.1.3) (2026-03-01)


### Bug Fixes

* **basecamp:** enforce minimum length for discordId in attendance schema ([5e206fd](https://github.com/yeti-robotics/polar-edge/commit/5e206fd6e650bd3bec7bf3caa6b2ef708ab06189))

## [1.1.2](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.1.1...basecamp-v1.1.2) (2026-03-01)


### Bug Fixes

* **basecamp:** logic fixes for attendance ([580d354](https://github.com/yeti-robotics/polar-edge/commit/580d354d3c0da71bc1b7f7faae8bede269743087))

## [1.1.1](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.1.0...basecamp-v1.1.1) (2026-03-01)


### Bug Fixes

* **basecamp:** make devGuildId optional in config schema ([92d3b12](https://github.com/yeti-robotics/polar-edge/commit/92d3b12d43db452e478f6f9c913a347b16a285c9))
* **basecamp:** set default value for devGuildId in attendance service ([d119002](https://github.com/yeti-robotics/polar-edge/commit/d119002bf5ce4e731216edc49c3c51f0ca520eb8))

## [1.1.0](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.0.7...basecamp-v1.1.0) (2026-03-01)


### Features

* **basecamp:** show overall rank in /attendance command ([#460](https://github.com/yeti-robotics/polar-edge/issues/460)) ([13d669a](https://github.com/yeti-robotics/polar-edge/commit/13d669acc379601c934b797a3d237e2167b12f82))
* **scouting:** build an event overview page with sortable teams table ([#455](https://github.com/yeti-robotics/polar-edge/issues/455)) ([f3050d6](https://github.com/yeti-robotics/polar-edge/commit/f3050d6dbe7d8969929461a4166e7be25155c389))


### Bug Fixes

* **basecamp:** extract all inline rounding into math utility functions ([#464](https://github.com/yeti-robotics/polar-edge/issues/464)) ([913fac5](https://github.com/yeti-robotics/polar-edge/commit/913fac5b8810c392f39ea7579f55a91c631a4046))

## [1.0.7](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.0.6...basecamp-v1.0.7) (2026-02-27)


### Bug Fixes

* **basecamp:** missing question in handbook command ([#458](https://github.com/yeti-robotics/polar-edge/issues/458)) ([797ac43](https://github.com/yeti-robotics/polar-edge/commit/797ac43864abf4ce9126ad4d6f87b63b91e6fb8d))

## [1.0.6](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.0.5...basecamp-v1.0.6) (2026-02-21)


### Bug Fixes

* **basecamp:** stale signin handling and error bubbling ([#433](https://github.com/yeti-robotics/polar-edge/issues/433)) ([0ec2e0b](https://github.com/yeti-robotics/polar-edge/commit/0ec2e0b9ecb9ff27a1f9f887d0109e8b579a9ffa))

## [1.0.5](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.0.4...basecamp-v1.0.5) (2026-02-20)


### Bug Fixes

* **basecamp:** update Dockerfile paths for improved directory structure ([45ecaac](https://github.com/yeti-robotics/polar-edge/commit/45ecaac3428b2bc457a0972994ed03972a821596))

## [1.0.4](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.0.3...basecamp-v1.0.4) (2026-02-20)


### Bug Fixes

* **basecamp:** enhance Dockerfile and update TypeScript configuration ([7737d87](https://github.com/yeti-robotics/polar-edge/commit/7737d87f12b5ef126137a2cd006c6d12df48da83))

## [1.0.3](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.0.2...basecamp-v1.0.3) (2026-02-20)


### Bug Fixes

* **basecamp:** update Dockerfile and webpack configuration for improved file structure ([0eb35cd](https://github.com/yeti-robotics/polar-edge/commit/0eb35cd4aa66ea170dfbaa09e5f5289f4deea838))

## [1.0.2](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.0.1...basecamp-v1.0.2) (2026-02-20)


### Bug Fixes

* **basecamp:** update dependencies and improve Dockerfile structure to reduce image size ([f4c2f3f](https://github.com/yeti-robotics/polar-edge/commit/f4c2f3fb85abf35def27d1cf72c4361fa67aa099))

## [1.0.1](https://github.com/yeti-robotics/polar-edge/compare/basecamp-v1.0.0...basecamp-v1.0.1) (2026-02-07)


### Bug Fixes

* **scouting:** test release please workflow with GitHub App token ([95a0164](https://github.com/yeti-robotics/polar-edge/commit/95a0164297f6ccfba9332e8fe8ce1fd7309684bc))
