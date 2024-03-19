# Changelog

## 0.2.9 (2024-03-19)


### Miscellaneous

* **deps:** Update dependencies ([7d67251](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/7d67251c3a71eed30ffa4ddfb3a8804aafda7425))
* Upgrade build tools ([c72757c](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/c72757c96153852f65bdb59f2b17306c077ac275))

## [0.2.8](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.2.7...v0.2.8) (2023-10-22)

### Bug Fixes

-   **qseow:** No more "invalid task source" error for task operations ([027f388](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/027f38874e411ecea3f028d8e9d039bc91e6d16c))

## [0.2.7](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.2.6...v0.2.7) (2023-09-28)

### Features

-   **qseow:** Add operation task-id-lookup operation ([fbd0d4e](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/fbd0d4ee91a9e22f53e05bc3acfa86f6b7ef1601)), closes [#85](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/85)

### Bug Fixes

-   **qseow:** Test streams rather than spaces for QSEoW ([1807bac](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/1807bac46f5df3533dd1cedfebad3434128529db)), closes [#86](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/86)

### Miscellaneous

-   **deps:** Update dependencies ([177c643](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/177c643b0d962c4aef38dbd41b9198f7e0018f47))

## [0.2.6](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.2.5...v0.2.6) (2023-09-18)

### Bug Fixes

-   Pass-through of parts/reset message properties ([2db6663](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/2db66632b36e968b5ab14e36d37a34da2d4cf769)), closes [#81](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/81)
-   **qseow:** Respect ignore-anauthorised-cert settings for all calls to QSEoW ([7427151](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/7427151f8a9a0a9f4ec276b049b8f2cc184f0fc7))

## [0.2.5](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.2.4...v0.2.5) (2023-09-18)

### Bug Fixes

-   **qseow:** Error when multiple Node-RED instances run in parallel ([5be3f63](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/5be3f63b710d978fa55bb5c62d6a28f4189a4f90)), closes [#78](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/78)

## [0.2.4](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.2.3...v0.2.4) (2023-09-17)

### Features

-   **qseow:** Add control of rejectUnauthorized cert to QSEoW server config ([435a479](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/435a479942c416c27f0f5e72949785fd8bfa371f))
-   **qseow:** Add get-script and set-script operations to qseow-app node ([9a0f4f6](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/9a0f4f631d1eedea3481ddb7ff9bb42bb7085caf)), closes [#75](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/75)
-   **qseow:** Add Qlik engine QSEOW server config node ([0f18a5c](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/0f18a5ce96c34efe37561fab4a15848d14094425))

### Miscellaneous

-   **deps:** Update esbuild ([eca3719](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/eca3719845929bf025cd4cd069e5b2ced927f92b))

## [0.2.3](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.2.2...v0.2.3) (2023-09-14)

### Features

-   **cloud:** Add qscloud-user node ([9554917](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/95549171ac1518ef485045cc503475f2e535f495)), closes [#70](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/70)

## [0.2.2](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.2.1...v0.2.2) (2023-09-13)

### Documentation

-   Format CHANGELOG.md ([8aed5ee](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/8aed5ee833421ec105ad11722b56cedafade77e8))

## [0.2.1](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.2.0...v0.2.1) (2023-09-13)

### Features

-   **cloud:** Add app ID lookup operation to qscloud-app node ([f502b31](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/f502b3148957c53a8862373757c4bf87e3a1b988)), closes [#64](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/64)
-   **qseow:** Add app ID lookup operation to qseow-app node ([b18afa7](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/b18afa7f660c2f6aadac362ac15842e7ba446c3b)), closes [#65](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/65)

### Bug Fixes

-   **cloud:** Fix typo in reload status out msg ([326342e](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/326342e864aab759ac26604879ad2e9e6f0ed299)), closes [#63](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/63)
-   **cloud:** Make all output msgs from reload status lower case ([3b4676c](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/3b4676c9e138347ca795e0e765c069066946127f))

## [0.2.0](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.1.4...v0.2.0) (2023-09-11)

### ⚠ BREAKING CHANGES

-   **cloud:** Move cloud license info to msg.payload.license in out msg

### Bug Fixes

-   **cloud:** clientId no longer required when using API key auth ([233ede3](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/233ede30e6ad408f2ace7d885de74b21835ebf3f)), closes [#59](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/59)
-   **cloud:** Move cloud license info to msg.payload.license in out msg ([8c95c9e](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/8c95c9e775e3d07d8ebfa3f6eecf8ad177b5cc0b)), closes [#60](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/60)

## [0.1.4](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.1.3...v0.1.4) (2023-09-11)

### Features

-   **qseow:** Add qseow-license node ([c47e49d](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/c47e49d48ea7927988cd9b85fa9e27c1c87c0867)), closes [#56](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/56)

### Documentation

-   **client-managed:** Correct input message format for tag delete operation ([4ce510d](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/4ce510d4d4bd087da9d46902268424a4c9ed7823)), closes [#55](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/55)

## [0.1.3](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.1.2...v0.1.3) (2023-09-10)

### Bug Fixes

-   **qseow:** Better logging when deleting tags ([3eee9ed](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/3eee9edd7777c2271e5ff698d944e42f2a7f8beb)), closes [#52](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/52)

### Miscellaneous

-   **deps:** Update dependencies to stay safe and secure ([71c1c84](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/71c1c848a7191460bdce6163888dcbc2bdd3ed77))

## [0.1.2](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.1.1...v0.1.2) (2023-09-09)

### Bug Fixes

-   Show correct node status when tags have been deleted ([b9cd046](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/b9cd04651dfddb285ab0fccfb051afd0dcc18749)), closes [#49](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/49)

## [0.1.1](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.1.0...v0.1.1) (2023-09-09)

### Bug Fixes

-   Handle Windows line breaks in tag/app/task editors ([fb54601](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/fb54601ee1da117854f80046af4c0de27be36030)), closes [#46](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/46)
-   Set default auth type to API key when creating new tenant config ([34703a8](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/34703a841072d33d6c3cf974f46f97e4e8b513fd)), closes [#44](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/44)

## [0.1.0](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.0.6...v0.1.0) (2023-09-07)

### ⚠ BREAKING CHANGES

-   Updated README and prettified example files

### Features

-   Add support for comments in cloud app ID definition editor ([e56f389](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/e56f389acef3cf0d4065cb7de4a54485b465e526)), closes [#38](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/38)

### Miscellaneous

-   Make breaking changes pre 1.0.0 result in minor updates ([4721bd4](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/4721bd4d34288e690de1fa3d0656ef71b00bbc2b))

### Documentation

-   Add missing output property for cloud app reload node ([986f235](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/986f2357e3d5fe53eea2d037e8645bd44c235240))
-   Add more examples of using cloud nodes ([ba7d54c](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/ba7d54cd8e97abb45fe2f598337e42910b79ccf1))
-   Added numerous examples for both Cloud and QSEoW. ([ef7209e](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/ef7209e68bb5170201c136c6cd1aa8ed47976a02))
-   Updated README and prettified example files ([ba8ccbb](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/ba8ccbb74f26e2cfc6611af9b12f352a4ee2bf4a))

## [0.0.6](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.0.5...v0.0.6) (2023-09-06)

### Miscellaneous

-   Add .npmignore file ([819dde5](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/819dde5a189f1b0a719ea57af713d8a988cb4d9d)), closes [#24](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/24)
-   **deps:** update actions/checkout action to v4 ([3257516](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/325751671b0da4b06b7497fe4ad43d928fbe709e))

### Documentation

-   Add docs for cloud nodes ([65eac94](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/65eac9465e2ebde822c5f48a2a939f8848762899)), closes [#28](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/28)
-   Added 2 QSEoW examples ([54a87aa](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/54a87aa77519a04d3100cd0b13c9fee6a7c45ee2)), closes [#31](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/31)
-   Create logo ([a172337](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/a172337bc8600c224610fc5641b88a6f1011d86b)), closes [#32](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/32)
-   Update README with logo and badges ([c5e3a60](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/c5e3a608ab0aa6531e459867b29a8154be94d69e)), closes [#33](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/33)

## [0.0.5](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.0.4...v0.0.5) (2023-09-03)

### Bug Fixes

-   Better handling of root CA certs for QSEoW ([638bfb7](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/638bfb7d520e6d3a53f8a7e3cc07fa799c9b53c9))
-   Improve handling of API key/Oauth for cloud ([2539c4d](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/2539c4d5a094762d98ef34495dbac27466d72cd6)), closes [#25](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/25)

## [0.0.4](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.0.3...v0.0.4) (2023-09-03)

### Bug Fixes

-   Add CA cert support for QSEoW ([ff4a715](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/ff4a7150118dbb06b770a6b990a01d6da9056656)), closes [#20](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/20)

### Refactoring

-   Put cloud and QSEoW files in separate directories ([dece4b3](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/dece4b31157121023ff4430fac198271371e9881)), closes [#21](https://github.com/ptarmiganlabs/ctrl-q-nr/issues/21)

## [0.0.3](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.0.2...v0.0.3) (2023-09-02)

### Bug Fixes

-   Add link to GitHub repo from npm ([c9535cc](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/c9535cc0909dda46d806453a961fa6cc4bda4dd1))

### Documentation

-   Add content to readme file ([e34fc05](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/e34fc05fd823914f30bfdf9f62c8f02868524d08))

## [0.0.2](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.0.1...v0.0.2) (2023-09-02)

### Bug Fixes

-   Add missing config nodes ([b24ad1a](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/b24ad1aede6f776ff2e7cac3fa66b9d724211f6f))
-   Improve Node-RED scorecard ranking ([1d69040](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/1d690400c83550a5024d5af1be013e8fff23a755))
-   Publish to npm public package ([ebd5077](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/ebd507771c226a4a88813bd82cd5b3b38bfec83d))

### Miscellaneous

-   **main:** release 0.0.1 ([4e9ccb6](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/4e9ccb6f4e3ba46586558a355ad9a1d7d486576f))

## [0.0.1](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.0.1...v0.0.1) (2023-09-02)

### Features

-   First commit ([fadb72b](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/fadb72b03593fd2e0b16cf5dbc955a7242332779))
-   Getting CI set up ([e901eb7](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/e901eb787a81cab356237adb10bafea0646a6a4c))
-   Set up CI ([951ad4b](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/951ad4b029e980c8397981539c208a91b40b808c))
-   Set up CI ([a59e0d9](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/a59e0d91eeca5748cf6c743282effedbf40c3077))

### Bug Fixes

-   Publish to npm public package ([ebd5077](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/ebd507771c226a4a88813bd82cd5b3b38bfec83d))

### Miscellaneous

-   **deps-dev:** Bump prettier from 3.0.2 to 3.0.3 ([4182702](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/4182702be936a0d071ec6ab346fdf1056770ed96))
-   **deps:** Bump axios from 1.4.0 to 1.5.0 ([451e9e3](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/451e9e360d4c3da81c880b33fff4abc30e456b24))
-   Fix CI ([f14b45a](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/f14b45a42de0ca94b379b8c2e17c51864a47ca45))
-   **main:** release 0.0.1 ([1f1a9e8](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/1f1a9e810f792d0331920af40948c8e686fc3180))
-   **main:** release 0.0.1 ([1dfd1e0](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/1dfd1e0e0aae828350007a23713069de885c2770))

## [0.0.1](https://github.com/ptarmiganlabs/ctrl-q-nr/compare/v0.0.1...v0.0.1) (2023-09-02)

### Features

-   First commit ([fadb72b](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/fadb72b03593fd2e0b16cf5dbc955a7242332779))
-   Getting CI set up ([e901eb7](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/e901eb787a81cab356237adb10bafea0646a6a4c))
-   Set up CI ([951ad4b](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/951ad4b029e980c8397981539c208a91b40b808c))
-   Set up CI ([a59e0d9](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/a59e0d91eeca5748cf6c743282effedbf40c3077))

### Miscellaneous

-   **deps-dev:** Bump prettier from 3.0.2 to 3.0.3 ([4182702](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/4182702be936a0d071ec6ab346fdf1056770ed96))
-   **deps:** Bump axios from 1.4.0 to 1.5.0 ([451e9e3](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/451e9e360d4c3da81c880b33fff4abc30e456b24))
-   Fix CI ([f14b45a](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/f14b45a42de0ca94b379b8c2e17c51864a47ca45))
-   **main:** release 0.0.1 ([1dfd1e0](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/1dfd1e0e0aae828350007a23713069de885c2770))

## 0.0.1 (2023-09-02)

### Features

-   First commit ([fadb72b](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/fadb72b03593fd2e0b16cf5dbc955a7242332779))
-   Getting CI set up ([e901eb7](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/e901eb787a81cab356237adb10bafea0646a6a4c))
-   Set up CI ([951ad4b](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/951ad4b029e980c8397981539c208a91b40b808c))
-   Set up CI ([a59e0d9](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/a59e0d91eeca5748cf6c743282effedbf40c3077))

### Miscellaneous

-   **deps-dev:** Bump prettier from 3.0.2 to 3.0.3 ([4182702](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/4182702be936a0d071ec6ab346fdf1056770ed96))
-   **deps:** Bump axios from 1.4.0 to 1.5.0 ([451e9e3](https://github.com/ptarmiganlabs/ctrl-q-nr/commit/451e9e360d4c3da81c880b33fff4abc30e456b24))
