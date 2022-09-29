Usage Guide
===========

pn-chrono is an example crypto wallet implementation of [Libplanet](https://github.com/planetarium/libplanet) that targets [planet-node](https://github.com/planetarium/planet-node) as an extension for Chromium-based browsers. It features locally signed transactions, mnemonic, and a [hierarchical deterministic wallet](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki).


Start using pn-chrono
---------------------

When you install pn-chrono on Chromium-based browsers, you will be greeted with the following screen:

<img width="370" alt="image" src="https://user-images.githubusercontent.com/7963440/192480471-9c1d6995-81af-4661-9eba-b1db628ba453.png">

Please create a password that will unlock your wallet. Note that if this password is compromised by someone who has a physical access to your computer, they can do whatever they please with your funds, so choose wisely.

Then, you will see a screen like this:

<img width="370" alt="image" src="https://user-images.githubusercontent.com/7963440/192481022-3850dda3-423a-4f3a-b3a9-b15e6fd68a0f.png">

If you are generating a new wallet, please take a note of the seed phrase and store it somewhere safe, preferably off the grid. The seed phrase is a mnemonic code in compliance with [BIP 39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki), and can be used to reconstruct the private keys of your accounts generated within the wallet. If it is compromised, the perpetrator can have the funds inside every account of the wallet at their disposal without any extra information. Also, if you do not have a backup of the wallet, private keys of the accounts, nor the seed phrase, you cannot recover your wallet, so make sure you do not lose it.

In case you are restoring your wallet from a seed phrase, please switch to the Recover tab and input your mnemonic code:

<img width="370" alt="image" src="https://user-images.githubusercontent.com/7963440/192485176-712ca844-5024-40f4-8da9-8b308c00bfb3.png">


Main screen
-----------

<img width="371" alt="image" src="https://user-images.githubusercontent.com/7963440/192485277-7a4b8605-34bb-4d78-96fe-978ae9628232.png">

In the main screen, you can see features like the lock button, the account selector, the public key for your currently selected wallet, the transfer button, and the transaction history.


Lock screen
-----------

If you click on the lock button: <img width="29" alt="image" src="https://user-images.githubusercontent.com/7963440/192486712-3c4a3c7f-80e2-4005-81aa-9de41567fff8.png"> your wallet will be locked:

<img width="375" alt="image" src="https://user-images.githubusercontent.com/7963440/192487382-9267fbaa-e5a6-4331-8b5a-9a52757df0ce.png">


Account selector
----------------

When you click on the account selector, you will be able to change your active account, generate a new account connected to your wallet, or import an account from its private key:

<img width="283" alt="image" src="https://user-images.githubusercontent.com/7963440/192487991-28b8212c-46ec-415b-877f-6f3ddcc96ad3.png">


### Generating a new account

Your wallet is a [hierarchical deterministic wallet](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki). The wallet can generate multiple accounts using your seed phrase, and the series of accounts you generate with the same seed phrase will always be the same, so if you recover your wallet using the seed phrase and generate accounts, the accounts in series will have the same keys and addresses in the same order generated on another instance of the wallet with the same seed phrase.

<img width="320" alt="image" src="https://user-images.githubusercontent.com/7963440/192489060-ae44361b-45eb-4b8d-8d76-7977a0851ac7.png">


### Importing an account with its private key

You can import an account with its private key:

<img width="320" alt="image" src="https://user-images.githubusercontent.com/7963440/192490096-e7dfa394-e1f6-4e63-bfd4-7c96e28fb988.png">

Unlike accounts generated from the seed phrase, the account imported with its private key will not be linked with your wallet, so you have to have a separate backup for its private key. An imported account will be indicated in the account selector:

<img width="260" alt="image" src="https://user-images.githubusercontent.com/7963440/192493875-b0ac16f9-c615-444e-a089-57c0f17fd0d1.png">


### Modifying an account

When you click on the <img width="27" alt="image" src="https://user-images.githubusercontent.com/7963440/192494737-fe60aa54-4508-4142-ba9f-a5181929a45a.png"> icon next to a desired account, you can edit the name of the account or delete the account:

<img width="321" alt="image" src="https://user-images.githubusercontent.com/7963440/192494866-bb1fcc5e-3c39-43bc-adfb-74ecf19b3a28.png">

Note that you cannot delete your first account.


Account address
---------------

On the right, you will see the abbreviated address of the currently selected account:

<img width="130" alt="image" src="https://user-images.githubusercontent.com/7963440/192490827-0f281af1-c4e5-4a53-9aa7-cb42f3ab1f5d.png">

You can copy the address by clicking on the <img width="22" alt="image" src="https://user-images.githubusercontent.com/7963440/192490916-33d6171a-e567-4f9e-95d0-3af6723c0020.png"> icon.


### Full account address

When you click on the abbreviated account address, you can see the full address:

<img width="322" alt="image" src="https://user-images.githubusercontent.com/7963440/192491387-b37f0bea-6ce2-4af8-84b3-d24f17d92730.png">


### Private key

Click on the `Show PrivateKey` button, and you will be asked for the wallet password.

<img width="319" alt="image" src="https://user-images.githubusercontent.com/7963440/192491685-34c03276-e437-47a1-88fb-87e349d48515.png">

Once you are authenticated, you can access the private key of the currently selected account:

<img width="320" alt="image" src="https://user-images.githubusercontent.com/7963440/192491881-2599e1de-e9c8-4ac4-a1b6-4b4161227ca4.png">

Click on <img width="23" alt="image" src="https://user-images.githubusercontent.com/7963440/192491918-8f094f45-13cb-4957-a8d3-df98db889178.png"> to reveal.


Transfer
--------

In the main screen, click on the `Transfer` button to enter the transfer screen:

<img width="370" alt="image" src="https://user-images.githubusercontent.com/7963440/192492114-dd196e01-0484-4391-9bf1-a333b943225b.png">

Here, you can select the account to send from, enter the receiving address, see the balance of the sending account, and set the amount to send. Once you fill in the details and click next, you will see the confirmation screen:

<img width="366" alt="image" src="https://user-images.githubusercontent.com/7963440/192494158-a451384a-c65b-4ea2-b102-8baed7becd43.png">

Please thoroughly confirm the receiver address, as you will not be able to recover any funds if you send the funds to a wrong address. Once you submit your transaction, you will see an item in your transaction history:

<img width="343" alt="image" src="https://user-images.githubusercontent.com/7963440/192494537-add1b069-4c87-4a09-9558-5863aa930756.png">
