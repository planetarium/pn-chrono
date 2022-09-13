# The Wallet for Planet Node
pn-chrono is the fork of [chrono], the crypto wallet service of chrome extension for [Nine Chronicles].
The main purpose of this fork is, providing crypto wallet example for [Libplanet] powered blockchain network, such as [planet-node].

As like planet-node, pn-chrono has been designed as example, so is not suitable under production environment.

[chrono]: https://github.com/tx0x/chrono
[Nine Chronicles]: https://nine-chronicles.com
[Libplanet]: https://libplanet.io
[planet-node]: https://github.com/planetarium/planet-node

## Project Structure

- `/background`: Implements the background context of the chrome extension. This is where important data storage and operations are executed.
- `/popup`: Implements the popup UI for the chrome extension. This has responsible for receiving user actions and communicating with the background context.
- `/extension`: This is where you handle the manifest settings and final build of your chrome extension.

## Getting Started

pn-chrono consists of three projects and they are all JavaScript projects. so you need the following JavaScript development tools.

- [Node.js] 16.13.1+
- [npm] 8.1.2+

Additionally, [Google Chrome] or [Microsoft Edge] are needed to run this project since it's a chrome extension.

[Node.js]: https://nodejs.org
[npm]: https://www.npmjs.com
[Google Chrome]: https://www.google.com/chrome
[Microsoft Edge]: https://www.microsoft.com/edge

### Prerequisites

### 1. Install Dependencies

```bash
npm --prefix background install
npm --prefix popup install
```

### 2. Run `popup` and `background` projects

```bash
npx grunt popup
npx grunt background
```

`popup` will opens `8001` and `background` will opens `8002`.
you can change them via `popup/package.json` and `background/package.json`. in that case, you need to edit below files under `extension` too.

- `extension/manifest.json`
- `extension/background.html`
- `extension/popup.html`

### 3. Import Chrome Extension (for development)

- Open `chrome://extensions` on chrome
- Load the unzipped extension.
- Select `~/chrono/extension`

### 4. Run unittest

if you want to run unittests in `background` or `popup` projects, simply can do that with `npm t` under each project directory.

## License

Apache 2.0