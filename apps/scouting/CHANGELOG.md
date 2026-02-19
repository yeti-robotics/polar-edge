# Changelog

## [2026.2.3](https://github.com/yeti-robotics/polar-edge/compare/scouting-v2026.2.2...scouting-v2026.2.3) (2026-02-19)


### Bug Fixes

* **scouting:** implement pending invite cookie handling ([690cdc6](https://github.com/yeti-robotics/polar-edge/commit/690cdc6997fc502f6861067ba685ce9c0df41498))

## [2026.2.2](https://github.com/yeti-robotics/polar-edge/compare/scouting-v2026.2.1...scouting-v2026.2.2) (2026-02-19)


### Bug Fixes

* **scouting:** reorder imports in proxy file for clarity ([f061bd4](https://github.com/yeti-robotics/polar-edge/commit/f061bd43aef3494c017a1aa728fd289f8991d2dd))
* **scouting:** streamline session cookie retrieval in proxy ([5b9531e](https://github.com/yeti-robotics/polar-edge/commit/5b9531ee4baba3abbbe6a1c5fc91cf8a351f848d))

## [2026.2.1](https://github.com/yeti-robotics/polar-edge/compare/scouting-v2026.2.0...scouting-v2026.2.1) (2026-02-19)


### Bug Fixes

* **auth:** add non-null assertion for BETTER_AUTH_URL in authentication setup ([f588306](https://github.com/yeti-robotics/polar-edge/commit/f5883066293272b6766b601327df7a485de0d87b))
* **scouting:** improve BETTER_AUTH_URL handling for hostname extraction ([e7bb696](https://github.com/yeti-robotics/polar-edge/commit/e7bb69613aef697e6a983a4e397a7a85f6486001))
* **scouting:** update hostname configuration for better authentication URL handling ([3b26b15](https://github.com/yeti-robotics/polar-edge/commit/3b26b152f2ddf8b50fa603a584185be879e52f83))

## [2026.2.0](https://github.com/yeti-robotics/polar-edge/compare/scouting-v2026.1.0...scouting-v2026.2.0) (2026-02-19)


### Features

* **scouting:** add combobox with team number and name for pit form [#382](https://github.com/yeti-robotics/polar-edge/issues/382) ([#396](https://github.com/yeti-robotics/polar-edge/issues/396)) ([ad8cfcf](https://github.com/yeti-robotics/polar-edge/commit/ad8cfcf9ea57f9869ba0e6fb147970612b277c23))
* **scouting:** add member removal capability ([#390](https://github.com/yeti-robotics/polar-edge/issues/390)) ([4fc417c](https://github.com/yeti-robotics/polar-edge/commit/4fc417c709e83e02d36168bc24e819976bb14053))
* **scouting:** add member role management functionality ([#388](https://github.com/yeti-robotics/polar-edge/issues/388)) ([f4a5672](https://github.com/yeti-robotics/polar-edge/commit/f4a56728154890b1ceae77ab9380ab3773503c0e))
* **scouting:** Add secure photo upload with compression and validation ([#398](https://github.com/yeti-robotics/polar-edge/issues/398)) ([e3c037f](https://github.com/yeti-robotics/polar-edge/commit/e3c037f7364a32db0c7e99564720320f7412f0d8))
* **scouting:** add settings page to configure organization name ([#397](https://github.com/yeti-robotics/polar-edge/issues/397)) ([58979cc](https://github.com/yeti-robotics/polar-edge/commit/58979cc06adc28513c9cd4ea9e965ac86acc3e25))
* **scouting:** enable optimistic support ([4d623c7](https://github.com/yeti-robotics/polar-edge/commit/4d623c7af1d8689c4338d0bc32958ef24a94f302))
* **scouting:** enhance picklist functionality and UI improvements ([1615ff6](https://github.com/yeti-robotics/polar-edge/commit/1615ff662924175a00ab9b31191b7555bafff98c))
* **scouting:** enhance picklist team management with notes and metrics ([c3f5c52](https://github.com/yeti-robotics/polar-edge/commit/c3f5c5287ccb3da85970a9afe36924b849fa19ff))
* **scouting:** implement picklist management features ([c0f6f80](https://github.com/yeti-robotics/polar-edge/commit/c0f6f8074bab0c1abf7cc3b8ba17615f46f0d3db))
* **scouting:** implement role-based access control and improve admin member checks ([facec07](https://github.com/yeti-robotics/polar-edge/commit/facec072ea4779b534807baa1604ea18ccfff3e6))
* **scouting:** implement role-based access control for organization management ([8a71535](https://github.com/yeti-robotics/polar-edge/commit/8a71535e03ffe1d9e5d737a8eeb22da299f2e443))
* **scouting:** implement viewing photos on teams page ([#399](https://github.com/yeti-robotics/polar-edge/issues/399)) ([4699e29](https://github.com/yeti-robotics/polar-edge/commit/4699e29aa8b13a9180af04223e0dfdc652065825))
* **scouting:** integrate DigitalOCean S3 for robot photo storage and add presigned URL generation ([25356b6](https://github.com/yeti-robotics/polar-edge/commit/25356b608d495cc84d11adce3374871ab3c50279))


### Bug Fixes

* avoid wrapping on small screens, avoid scroll ([74b2fd1](https://github.com/yeti-robotics/polar-edge/commit/74b2fd18ccd3df95ea8d8f75117d85285e60ef85))
* **database:** format JSON schema for consistency ([9b5d4cc](https://github.com/yeti-robotics/polar-edge/commit/9b5d4cccf41e40cf1b05cecdc06bd2a929edae6e))
* **scouting:** address broken import ([fb8be2d](https://github.com/yeti-robotics/polar-edge/commit/fb8be2d8a6c977befb55cd83350276a05aa456cd))
* **scouting:** improve error handling in team match lookup and streamline action state management ([02fe955](https://github.com/yeti-robotics/polar-edge/commit/02fe95540b4a40e5222004b87add7683c6a5374c))
* **scouting:** no bold headings ([8a3392f](https://github.com/yeti-robotics/polar-edge/commit/8a3392f17817c846da968af0aa912ca3cfaa4cc5))
* **scouting:** test release please workflow with GitHub App token ([95a0164](https://github.com/yeti-robotics/polar-edge/commit/95a0164297f6ccfba9332e8fe8ce1fd7309684bc))

## [2026.1.1-alpha.0](https://github.com/yeti-robotics/polar-edge/compare/scouting-v2026.1.0-alpha.0...scouting-v2026.1.1-alpha.0) (2026-02-07)


### Bug Fixes

* **scouting:** test release please workflow with GitHub App token ([95a0164](https://github.com/yeti-robotics/polar-edge/commit/95a0164297f6ccfba9332e8fe8ce1fd7309684bc))

## [2026.1.0-alpha.0](https://github.com/yeti-robotics/polar-edge/compare/scouting-v2026.0.0-alpha.0...scouting-v2026.1.0-alpha.0) (2026-02-07)


### Features

* **scouting:** add member removal capability ([#390](https://github.com/yeti-robotics/polar-edge/issues/390)) ([4fc417c](https://github.com/yeti-robotics/polar-edge/commit/4fc417c709e83e02d36168bc24e819976bb14053))
* **scouting:** add member role management functionality ([#388](https://github.com/yeti-robotics/polar-edge/issues/388)) ([f4a5672](https://github.com/yeti-robotics/polar-edge/commit/f4a56728154890b1ceae77ab9380ab3773503c0e))
