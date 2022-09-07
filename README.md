# The Wallet for Nine Chronicles
This is a crypto wallet service of chrome extension for Nine Chronicles blockchain.

Chrono Document
https://9cscan-tx0x.gitbook.io/chrono-wallet-nine-chronicles/

## Project Structure

- /background
  - Implements the background context of the chrome extension. This is where important data storage and operations are executed.
- /popup
  - Implement popup UI for chrome extension. It is responsible for receiving user actions and communicating with the background context.
- /extension
  - This is where you handle the manifest settings and final build of your chrome extension.

## Getting started

### 1. Pull this project to local

```
git clone https://github.com/tx0x/chrono
cd chrono
npm install
cd background
npm install
cd ../popup
npm install
```

### 2. Run 

```
grunt popup
grunt background
```

### 3. Import chrome extension for development

- open `chrome://extensions` on chrome
- Load the unzipped extension.
- select ~/chrono/extension

### 4. test

```
cd background
npm t

or

cd popup
npm t
```

## License

Apache 2.0